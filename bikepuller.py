from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import json
import configparser

# Define your database model
Base = declarative_base()
config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']

class Station(Base):
    __tablename__ = 'station'
    number = Column(Integer, primary_key=True)
    address = Column(String(128))
    banking = Column(Integer)
    bike_stands = Column(Integer)
    name = Column(String(128))
    position_lat = Column(Float)
    position_lng = Column(Float)

# Establish connection to your RDS database
DATABASE_URL = f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
session = Session()

# Query the database
db = session.query(Station).all()

# Serialize the query results to JSON
stations_data = [{"number": station.number, "address": station.address, "banking": station.banking, "stands":station.bike_stands, "name":station.name, "Latitude":station.position_lat, "Longitude":station.position_lng} for station in db]

# Write the JSON data to a file
with open('station_data.json', 'w') as outfile:
    json.dump(stations_data, outfile, indent=4)

# Close the session
session.close()