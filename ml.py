
from sqlalchemy import create_engine, text
import configparser
import pandas as pd
import numpy as np



config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']


DATABASE_URI =  f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"

engine = create_engine(DATABASE_URI)

def get_stations_dataframe():
    query = """
           WITH RoundedAvailability AS (
    SELECT number,
           available_bikes,
           available_bike_stands,
           DATE_FORMAT(last_update, '%Y-%m-%d %H:00:00') AS rounded_last_update,
           DATE_FORMAT(DATE_SUB(last_update, INTERVAL MINUTE(last_update) % 5 MINUTE), '%Y-%m-%d %H:%i:00') AS rounded_last_update_5mins,
           ROW_NUMBER() OVER(PARTITION BY number ORDER BY last_update DESC) AS rn
    FROM availability
),
RoundedWeather AS (
    SELECT lon,
           lat,
           temp,
           feels_like,
           humidity,
           rain_1h,
           weather_desc,
           weather_brief,
           wind_speed,
           weatherid,
           DATE_FORMAT(datetime, '%Y-%m-%d %H:00:00') AS rounded_datetime
    FROM weather
),
StationWithAvailability AS (
    SELECT s.number,
           s.name,
           s.position_lat,
           s.position_lng,
           a.available_bikes,
           a.available_bike_stands,
           a.rounded_last_update
    FROM station s
    JOIN RoundedAvailability a ON s.number = a.number
    WHERE a.rn = 1
)
SELECT swa.number,
       swa.name,
       swa.position_lat,
       swa.position_lng,
       swa.available_bikes,
       swa.available_bike_stands,
       swa.rounded_last_update,
       rw.temp,
       rw.feels_like,
       rw.humidity,
       rw.rain_1h,
       rw.weather_desc,
       rw.weather_brief,
       rw.wind_speed,
       rw.weatherid
FROM StationWithAvailability swa
JOIN RoundedWeather rw ON swa.rounded_last_update = rw.rounded_datetime;

        """
    with engine.connect() as connection:
        # Use the query string directly, but make sure to wrap it in `text()` here
        result = connection.execute(text(query))
        raw = result.fetchall()
       
        df = pd.DataFrame(raw, columns=result.keys())
        print(df.shape,df.columns)
    
    csv_filename = "stations_data.csv"
    df.to_csv(csv_filename, index=False)
    return f"Dataframe created. Check server logs for output."
get_stations_dataframe()

