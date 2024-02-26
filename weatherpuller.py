from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json
import configparser
import datetime

# Define your database model
Base = declarative_base()
config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']

class Weather(Base):
    __tablename__ = 'weather'
    lon = Column(Float, primary_key=True, nullable=False)
    lat = Column(Float, primary_key=True, nullable=False)
    datetime = Column(DateTime, primary_key=True, nullable=False)
    weatherid = Column(Integer, nullable=False)
    weather_brief = Column(String(128))
    weather_desc=Column(String(128))
    temp=Column(Float)
    feels_like=Column(Float)
    temp_min=Column(Float)
    temp_max=Column(Float)
    pressure=Column(Integer)
    humidity=Column(Integer)
    sea_level=Column(Integer)
    grnd_level=Column(Integer)
    visibility=Column(Integer)
    wind_speed=Column(Float)
    wind_direction_degs=Column(Integer)
    wind_gust=Column(Float)
    rain_1h=Column(Float)
    clouds=Column(Float)
    sunrise=Column(Integer)
    sunset=Column(Integer)


# Establish connection to your RDS database
DATABASE_URL = f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Query the database
db = session.query(Weather).all()

# Serialize the query results to JSON
weather_data = [{"lon": weather.lon, 
                  "lat": weather.lat, 
                  "datetime": (weather.datetime).isoformat(), 
                  "weatherid": weather.weatherid, 
                  "weather_brief": weather.weather_brief, 
                  "weather_desc": weather.weather_desc, 
                  "temp": weather.temp,
                  "feels_like": weather.feels_like, 
                  "temp_min": weather.temp_min, 
                  "temp_max": weather.temp_max, 
                  "pressure": weather.pressure, 
                  "humidity": weather.humidity, 
                  "sea_level": weather.sea_level, 
                  "grnd_level": weather.grnd_level,
                  "visibility": weather.visibility, 
                  "wind_speed": weather.wind_speed, 
                  "wind_direction_degs": weather.wind_direction_degs, 
                  "wind_gust": weather.wind_gust, 
                  "rain_1h": weather.rain_1h, 
                  "clouds": weather.clouds,
                  "sunrise": weather.sunrise, 
                  "sunset": weather.sunset

                  } for weather in db]



# Write the JSON data to a file
with open('weather_data.json', 'w') as outfile:
    json.dump(weather_data, outfile, indent=4)

# Close the session
session.close()