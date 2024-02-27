from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, exc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import requests
import datetime 
import configparser
import time
import json

Base = declarative_base()
config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']
api_config=config['weather_api']

# API key 
api_key = 'ca224502e7a2a285e6b4bf2e73ddf465'

class Forecast(Base):
    __tablename__ = 'forecast'
    datetime = Column(DateTime, primary_key=True, nullable=False)
    lon = Column(Float, primary_key=True, nullable=False)
    lat = Column(Float, primary_key=True, nullable=False)
    forecastedtime=Column(DateTime, primary_key=True, nullable=False)
    temp=Column(Float)
    feels_like=Column(Float)
    temp_min=Column(Float)
    temp_max=Column(Float)
    pressure=Column(Integer)
    sea_level=Column(Integer)
    grnd_level=Column(Integer)
    humidity=Column(Integer)
    weatherid=Column(Integer)
    weather_brief = Column(String(128))
    weather_desc=Column(String(128))
    clouds=Column(Float)
    wind_speed=Column(Float)
    wind_direction_degs=Column(Integer)
    wind_gust=Column(Float)
    visibility=Column(Integer)
    probability_of_rain=Column(Float)
    rain_3h=Column(Float)


engine = create_engine(f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}")

Base.metadata.bind=engine

DBSession=sessionmaker(bind=engine)
session=DBSession()

def get_forecast_data(longitude, latitude):
    try:
        url=f"https://api.openweathermap.org/data/2.5/forecast?lat={latitude}&lon={longitude}&cnt=16&appid={api_key}"
        response=requests.get(url)
        response.raise_for_status() 
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
        return None
    
def insert_forecast(data):
    for fc in data["list"]:
        currenttime=datetime.datetime.now()

        try:
            if 'rain' in fc:
                new_forecast=Forecast(
                    datetime = currenttime,
                    lon = data["city"]["coord"]["lon"],
                    lat = data["city"]["coord"]["lat"],
                    forecastedtime=datetime.datetime.fromtimestamp(fc["dt"]),
                    temp=fc["main"]["temp"],
                    feels_like=fc["main"]["feels_like"],
                    temp_min=fc["main"]["temp_min"],
                    temp_max=fc["main"]["temp_max"],
                    pressure=fc["main"]["pressure"],
                    sea_level=fc["main"]["sea_level"],
                    grnd_level=fc["main"]["grnd_level"],
                    humidity=fc["main"]["humidity"],
                    weatherid=fc["weather"][0]["id"],
                    weather_brief=fc["weather"][0]["main"],
                    weather_desc=fc["weather"][0]["description"],
                    clouds=fc["clouds"]["all"],
                    wind_speed=fc["wind"]["speed"],
                    wind_direction_degs=fc["wind"]["deg"],
                    wind_gust=fc["wind"]["gust"],
                    visibility=fc["visibility"],
                    probability_of_rain=fc["pop"],
                    rain_3h=fc["rain"]["3h"]
                )
            else:
                new_forecast=Forecast(
                    datetime = currenttime,
                    lon = data["city"]["coord"]["lon"],
                    lat = data["city"]["coord"]["lat"],
                    forecastedtime=datetime.datetime.fromtimestamp(fc["dt"]),
                    temp=fc["main"]["temp"],
                    feels_like=fc["main"]["feels_like"],
                    temp_min=fc["main"]["temp_min"],
                    temp_max=fc["main"]["temp_max"],
                    pressure=fc["main"]["pressure"],
                    sea_level=fc["main"]["sea_level"],
                    grnd_level=fc["main"]["grnd_level"],
                    humidity=fc["main"]["humidity"],
                    weatherid=fc["weather"][0]["id"],
                    weather_brief=fc["weather"][0]["main"],
                    weather_desc=fc["weather"][0]["description"],
                    clouds=fc["clouds"]["all"],
                    wind_speed=fc["wind"]["speed"],
                    wind_direction_degs=fc["wind"]["deg"],
                    wind_gust=fc["wind"]["gust"],
                    visibility=fc["visibility"],
                    probability_of_rain=fc["pop"],
                    rain_3h=0
                )
            session.add(new_forecast)
            session.commit()

        except IntegrityError:
            session.rollback()


while True:
    data1 = get_forecast_data(-6.25064,53.33758)
    data2 = get_forecast_data(-6.25064,53.35253)
    data3 = get_forecast_data(-6.29023,53.33758)
    data4 = get_forecast_data(-6.29023,53.35253)
    if data1:
        insert_forecast(data1)
    if data2:
        insert_forecast(data2)
    if data3:
        insert_forecast(data3)
    if data4:    
        insert_forecast(data4)
    time.sleep(3600)


