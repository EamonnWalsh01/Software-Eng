from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, exc
import requests
import datetime

Base = declarative_base()

# Define your Availability class here as before

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
# Format: mysql+pymysql://<username>:<password>@<host>/<dbname>
# Replace <username>, <password>, <host>, and <dbname> with the Amazon Database Credentials
engine = create_engine('mysql+pymysql://root:@localhost:3306/bike_test')

Base.metadata.bind = engine

DBSession = sessionmaker(bind=engine)
session = DBSession()

def get_station_data(contract_name, api_key):
    try:
        url = f"https://api.jcdecaux.com/vls/v1/stations?contract={contract_name}&apiKey={api_key}"
        response = requests.get(url)
        response.raise_for_status()  # Raises an HTTPError if the response status is 4XX/5XX
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
        return None

def insert_availability(data):
    try:
        for station in data:
            # Handling existing station data
            existing_station = session.query(Availability).filter_by(number=station['number']).first()
            if existing_station:
                # Update existing record
                existing_station.last_update = datetime.datetime.fromtimestamp(station['last_update'] / 1e3)
                existing_station.available_bikes = station['available_bikes']
                existing_station.available_bike_stands = station['available_bike_stands']
                existing_station.status = station['status']
            else:
                # Insert new record
                new_station = Availability(
                    number=station['number'],
                    last_update=datetime.datetime.fromtimestamp(station['last_update'] / 1e3),
                    available_bikes=station['available_bikes'],
                    available_bike_stands=station['available_bike_stands'],
                    status=station['status']
                )
                session.add(new_station)
        session.commit()
    except exc.SQLAlchemyError as e:
        print(f"Database error: {e}")
        session.rollback()  # Roll back the changes on error
    except Exception as e:
        print(f"Unexpected error: {e}")
        session.rollback()  # Roll back the changes on error


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


contract_name = "dublin"
api_key = "7e205fdc326671c53ea2ffa938113d65068803f3"
data = get_station_data(contract_name, api_key)

if data:
    insert_availability(data)
    insert_stations(data)
