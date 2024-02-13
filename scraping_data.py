from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, exc
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import IntegrityError
import requests
import datetime
import configparser

Base = declarative_base()
config = configparser.ConfigParser()
config.read('config.ini')
db_config = config['database']
api_config = config['api']

class Availability(Base):
    __tablename__ = 'availability'
    number = Column(Integer, primary_key=True)
    last_update = Column(DateTime, nullable=False)
    available_bikes = Column(Integer)
    available_bike_stands = Column(Integer)
    status = Column(String(128))

class Station(Base):
    __tablename__ = 'station'
    number = Column(Integer, primary_key=True)
    address = Column(String(128))
    banking = Column(Integer)
    bike_stands = Column(Integer)
    name = Column(String(128))
    position_lat = Column(Float)
    position_lng = Column(Float)


# Connect to the MySQL database
engine = create_engine(f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}")


Base.metadata.bind = engine

DBSession = sessionmaker(bind=engine)
session = DBSession()

def get_station_data():
    try:
        url = f"https://api.jcdecaux.com/vls/v1/stations?contract={api_config['contract_name']}&apiKey={api_config['api_key']}"
        response = requests.get(url)
        response.raise_for_status()  # Raises an HTTPError if the response status is 4XX/5XX
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
        return None


def insert_availability(data):
    for station in data:
        # Convert timestamp to a datetime object
        last_update_datetime = datetime.datetime.fromtimestamp(station['last_update'] / 1000)
        
        # Attempt to insert new data
        try:
            new_availability = Availability(
                number=station['number'],
                last_update=last_update_datetime,
                available_bikes=station['available_bikes'],
                available_bike_stands=station['available_bike_stands'],
                status=station['status']
            )
            session.add(new_availability)
            session.commit()
        except IntegrityError:
            # This block is reached if the insert operation fails due to an IntegrityError, which
            # in this case likely means the primary key already exists. Roll back the session.
            session.rollback()
            print(f"Record for station number {station['number']} at {last_update_datetime} already exists. Skipping insert.")


def insert_stations(data):
    try:
        for station in data:
            # Check if the station already exists to avoid duplicates
            existing_station = session.query(Station).filter_by(number=station['number']).first()
            if not existing_station:
                new_station = Station(
                    number=station['number'],
                    address=station['address'],
                    banking=1 if station['banking'] else 0,
                    bike_stands=station['bike_stands'],
                    name=station['name'],
                    position_lat=station['position']['lat'],
                    position_lng=station['position']['lng']
                )
                session.add(new_station)
        session.commit()
    except Exception as e:
        print(f"Error inserting data into database: {e}")
        session.rollback()  # Ensure the session is rolled back on error


# Get the data from the API
data = get_station_data()

if data:
    insert_availability(data)
    insert_stations(data)
