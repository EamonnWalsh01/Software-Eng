
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
get_stations_dataframe()