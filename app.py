from flask import Flask, jsonify
from sqlalchemy import create_engine, text
import configparser

app = Flask(__name__, static_url_path='')

config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']


DATABASE_URI =  f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"

engine = create_engine(DATABASE_URI)

@app.route('/station')
def get_stations():
    with engine.connect() as connection:
        result = connection.execute(text("SELECT * FROM station"))
        stations = [{column: value for column, value in row.items()} for row in result]
    return jsonify(stations)


@app.route('/')
def root():
    return app.send_static_file('index.html')

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0",port=8080)