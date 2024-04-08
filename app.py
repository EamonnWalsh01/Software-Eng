from flask import Flask, jsonify, request
from sqlalchemy import create_engine, text
import configparser
import json
from datetime import datetime, timedelta
import pickle
import pandas as pd 
import numpy as np 
import requests
import time

app = Flask(__name__, static_url_path='')

config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']

weather_api = config['weather_api']['api_key']


DATABASE_URI =  f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"

engine = create_engine(DATABASE_URI)

@app.route('/stations')
def get_stations():
    with engine.connect() as connection:
        result = connection.execute(text("""
            SELECT s.number, s.address, s.banking, s.bike_stands, s.name, s.position_lat, s.position_lng, a.available_bikes
            FROM station s
            LEFT JOIN (
                SELECT number, available_bikes, ROW_NUMBER() OVER(PARTITION BY number ORDER BY last_update DESC) AS rn
                FROM availability
            ) a ON s.number = a.number AND a.rn = 1
        """))
        # Ensure proper conversion of row objects to dictionaries
        stations_list = [dict(row) for row in result.mappings()]
    return jsonify(stations_list)


@app.route('/availability/<int:number>')
def get_availability(number):
    with engine.connect() as connection:
        query = text("""
            SELECT * FROM availability 
            WHERE number = :number 
            ORDER BY last_update DESC 
            LIMIT 1
        """)
        result = connection.execute(query, {"number": number}).fetchone()
        if result:
            availability_data = dict(result._mapping)
            return jsonify(availability_data)
        else:
            return jsonify({"error": "No data found for station number {}".format(number)}), 404



@app.route('/data/historical/<int:number>')
def get_historical_data(number):
    twenty_four_hours_ago = datetime.now() - timedelta(days=1)
    
    with engine.connect() as connection:
        query = text("""
            SELECT last_update, available_bikes FROM availability
            WHERE last_update >= :twenty_four_hours_ago AND number = :number
            ORDER BY last_update
        """)
        result = connection.execute(query, {"twenty_four_hours_ago": twenty_four_hours_ago, "number": number})

        if result:
            data = [dict(row) for row in result.mappings()]
            return jsonify(data)
        else:
            return jsonify({"error": f"No historical data found for station number {number}"}), 404



@app.route('/stations/dataframe')
def get_stations_dataframe():
    query = """
            SELECT * FROM availability 
            
            ORDER BY last_update DESC 
            LIMIT 40
        """
    with engine.connect() as connection:
        # Use the query string directly, but make sure to wrap it in `text()` here
        result = connection.execute(text(query))
        array_data = np.array(result.fetchall())
        print(array_data)
    # Example of how to use the DataFrame, here we just print it
    print(array_data)
    return f"Dataframe created. Check server logs for output.{array_data}"


@app.route('/nearest-stations')
def nearest_stations():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    
    # Query to find the 5 nearest stations to the provided lat/lng
    # This is a simplistic calculation and does not account for Earth's curvature.
    # For more accuracy, consider using PostGIS with PostgreSQL or a similar spatial extension with your database.
    query = text("""
        SELECT s.number, s.name, s.position_lat, s.position_lng, a.available_bikes, a.available_bike_stands, a.last_update,
               SQRT(POW(69.1 * (s.position_lat - :lat), 2) +
                    POW(69.1 * (:lng - s.position_lng) * COS(s.position_lat / 57.3), 2)) AS distance
        FROM station s
        JOIN (
            SELECT number, available_bikes, available_bike_stands, last_update,
                   ROW_NUMBER() OVER(PARTITION BY number ORDER BY last_update DESC) AS rn
            FROM availability
        ) a ON s.number = a.number
        WHERE a.rn = 1
        ORDER BY distance
        LIMIT 5;
    """)

    params = {'lat': lat, 'lng': lng}  # Define parameters as a dictionary

    with engine.connect() as connection:
        result = connection.execute(query, params)  # Pass parameters dictionary as the second argument
        nearest_stations = [dict(row) for row in result.mappings()]
        print(nearest_stations)
    return jsonify(nearest_stations)


@app.route('/weather')
def current_weather():
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)

    with engine.connect() as connection:
        query=text("""
            SELECT lon, lat, temp, feels_like, humidity, rain_1h, weather_desc, weather_brief, wind_speed, weatherid, TIME_TO_SEC(datetime) as time, MOD(sunrise,86400)as sunrise, MOD(sunset,86400) as sunset, datetime,
                   SQRT(POW(69.1 * (lat - lat), 2) +
                    POW(69.1 * (lon - lon) * COS(lat / 57.3), 2)) AS distance
            FROM weather 
            ORDER BY datetime DESC
            LIMIT 1;      
                """)
        
        params = {'lat': lat, 'lng': lng}  # Define parameters as a dictionary

        result = connection.execute(query, params)  # Pass parameters dictionary as the second argument
        nearest_weather = [dict(row) for row in result.mappings()]
        print(nearest_weather)
        return jsonify(nearest_weather)
    

@app.route('/station/<int:station_number>')
def get_station(station_number):
    with engine.connect() as connection:
        result = connection.execute(text("""
            SELECT s.number, s.address, s.banking, s.bike_stands, s.name, s.position_lat, s.position_lng, a.available_bikes
            FROM station s
            LEFT JOIN (
                SELECT number, available_bikes, last_update
                FROM availability
                WHERE number = :station_number
                ORDER BY last_update DESC
                LIMIT 1
            ) a ON s.number = a.number
            WHERE s.number = :station_number
        """), {"station_number": station_number})
        
        # Attempt to fetch one row
        
        station_data = [dict(row) for row in result.mappings()]
        return jsonify(station_data)
        
    

@app.route('/data/predictive/<int:number>/<int:month>/<int:day>')
def predict(number,month,day):
    print('station',month,day)
    # Get input data from the request
    model_path = 'models/model'+str(number)+'.pkl'
    with open(model_path, 'rb') as file:
        model = pickle.load(file)
    
    station_info = json.loads(get_station(number).get_data(as_text=True))[0]
    lat = station_info['position_lat']
    lon = station_info['position_lng']

    forecast = get_weather_forecast_for_day(lat,lon,day,month)
    
    predictions_list = []
    for data in forecast:

        input_data = {
            'number': [number],
            'time_as_fraction': [int(data.get('time'))/86400],
            'month': [month],
            'day': [day],
            'day_of_week_0': [0],
            'day_of_week_1': [0],
            'day_of_week_2': [0],
            'day_of_week_3': [1],
            'day_of_week_4': [0],
            'day_of_week_5': [0],
            'day_of_week_6': [0],
            'temp': [data.get('temp')],
            'feels_like': [data.get('feels_like')] 
        }

        # Convert the input data into a pandas DataFrame
        df = pd.DataFrame.from_dict(input_data)
        predictions = model.predict(df)
        predictions_list.append({
            'time': data.get('time'),
            'availability': predictions.tolist()[0]
            })

    # Print the prediction
    print(predictions_list)
    return jsonify(predictions_list)

def get_weather_forecast_for_day(lat,lon, day, month):
    url = f'http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={weather_api}'
    response = requests.get(url)

    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        current_year = datetime.now().year
        date_object = datetime(current_year, month, day)
        start_timestamp = date_object.timestamp()
        end_timestamp  = start_timestamp  + 86400

        if(start_timestamp  < int(time.time())):
            start_timestamp  = int(time.time())

        filtered_forecasts = []
        # Loop through the forecast data
        for forecast in data['list']:
            # Check if the forecast time is within the specified range
            if start_timestamp <= forecast['dt'] <= end_timestamp:
                # Extract the desired information
                forecast_time = forecast['dt']
                temp = forecast['main']['temp']
                feels_like = forecast['main']['feels_like']
                
                # Append to the results list
                filtered_forecasts.append({
                    'time': forecast_time,
                    'temp': temp,
                    'feels_like': feels_like
                })

        return filtered_forecasts
    else:
        print("Failed to retrieve data")
        return None

@app.route('/')
def index():
    return app.send_static_file('map2.html')

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0",port=8080)