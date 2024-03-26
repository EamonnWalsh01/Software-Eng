
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
           WITH NumberSeries AS (
    SELECT 1 AS num
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    -- Add numbers up to 12
    UNION ALL SELECT 12
),
ExpandedWeather AS (
    SELECT w.*,
           ns.num AS interval_number,
           ADDTIME(w.datetime, MAKETIME(0, (ns.num - 1) * 5, 0)) AS interval_datetime
    FROM weather w
    CROSS JOIN NumberSeries ns
),
AvailabilityWithStation AS (
    SELECT s.number,
           s.name,
           s.position_lat,
           s.position_lng,
           a.available_bikes,
           a.available_bike_stands,
           a.last_update,
           DATE_FORMAT(a.last_update, '%Y-%m-%d %H:%i:00') AS rounded_last_update
    FROM station s
    JOIN availability a ON s.number = a.number
    -- Depending on your requirements, you might filter for the most recent data or a specific time range here
)
SELECT aws.number,
       aws.name,
       aws.position_lat,
       aws.position_lng,
       aws.available_bikes,
       aws.available_bike_stands,
       aws.last_update,
       ew.temp,
       ew.feels_like,
       ew.humidity,
       ew.rain_1h,
       ew.weather_desc,
       ew.weather_brief,
       ew.wind_speed,
       ew.weatherid
FROM AvailabilityWithStation aws
JOIN ExpandedWeather ew ON aws.rounded_last_update = ew.interval_datetime

        """
    with engine.connect() as connection:
        # Use the query string directly, but make sure to wrap it in `text()` here
        result = connection.execute(text(query))
        array_data = np.array(result.fetchall())
        print(array_data)
    # Example of how to use the DataFrame, here we just print it
    print(array_data[0])
    return f"Dataframe created. Check server logs for output.{array_data[0]}"
get_stations_dataframe()