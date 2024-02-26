from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, exc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import requests
import datetime
import configparser
import time
import json

#Connection credentials
Base = declarative_base()
config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']
api_config=config['weather_api']

# API key 
api_key = 'ca224502e7a2a285e6b4bf2e73ddf465'

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

# Connect to the MySQL database
engine = create_engine(f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}")

Base.metadata.bind = engine

DBSession = sessionmaker(bind=engine)
session = DBSession()

def get_weather_data(latitude, longitude):
    url = f'http://api.openweathermap.org/data/2.5/weather?lat={latitude}&lon={longitude}&appid={api_key}'

    # Make the GET request to the OpenWeatherMap API
    response = requests.get(url)

    # Check if the request was successful
    if response.status_code == 200:
        # Parse the JSON response
        data = response.json()
        return data
    else:
        print("Failed to retrieve data")
        return None
    

def insert_weather(data):
    # Attempt to insert new data
    try:
    #if True:
        if 'rain' in data:
            new_weather = Weather(
                lon = data["coord"]["lon"],
                lat = data["coord"]["lat"],
                datetime = datetime.datetime.fromtimestamp(data["dt"]),
                weatherid = data["weather"][0]["id"],
                weather_brief = data["weather"][0]["main"],
                weather_desc=data["weather"][0]["description"],
                temp=data["main"]["temp"],
                feels_like=data["main"]["feels_like"],
                temp_min=data["main"]["temp_min"],
                temp_max=data["main"]["temp_max"],
                pressure=data["main"]["pressure"],
                humidity=data["main"]["humidity"],
                sea_level=data["main"]["sea_level"],
                grnd_level=data["main"]["grnd_level"],
                visibility=data["visibility"],
                wind_speed=data["wind"]["speed"],
                wind_direction_degs=data["wind"]["deg"],
                wind_gust=data["wind"]["gust"],
                rain_1h=data["rain"]["1h"],
                clouds=data["clouds"]["all"],
                sunrise=data["sys"]["sunrise"],
                sunset=data["sys"]["sunset"]
            )
        else:
            new_weather = Weather(
                lon = data["coord"]["lon"],
                lat = data["coord"]["lat"],
                datetime = datetime.datetime.fromtimestamp(data["dt"]),
                weatherid = data["weather"][0]["id"],
                weather_brief = data["weather"][0]["main"],
                weather_desc=data["weather"][0]["description"],
                temp=data["main"]["temp"],
                feels_like=data["main"]["feels_like"],
                temp_min=data["main"]["temp_min"],
                temp_max=data["main"]["temp_max"],
                pressure=data["main"]["pressure"],
                humidity=data["main"]["humidity"],
                sea_level=data["main"]["sea_level"],
                grnd_level=data["main"]["grnd_level"],
                visibility=data["visibility"],
                wind_speed=data["wind"]["speed"],
                wind_direction_degs=data["wind"]["deg"],
                wind_gust=data["wind"]["gust"],
                rain_1h=0,
                clouds=data["clouds"]["all"],
                sunrise=data["sys"]["sunrise"],
                sunset=data["sys"]["sunset"]
            
             )
        session.add(new_weather)
        session.commit()
    except IntegrityError:
        # This block is reached if the insert operation fails due to an IntegrityError, which
        # in this case likely means the primary key already exists. Roll back the session.
        print("Error")
        session.rollback()


while True:
    data1 = get_weather_data(-6.25064,53.33758)
    data2 = get_weather_data(-6.25064,53.35253)
    data3 = get_weather_data(-6.29023,53.33758)
    data4 = get_weather_data(-6.29023,53.35253)
    if data1:
        insert_weather(data1)
    if data2:
        insert_weather(data2)
    if data3:
        insert_weather(data3)
    if data4:    
        insert_weather(data4)
    time.sleep(10800)