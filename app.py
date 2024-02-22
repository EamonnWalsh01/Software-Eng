from flask import Flask, jsonify
import sqlalchemy
import configparser

app = Flask(__name__, static_url_path='')

config = configparser.ConfigParser()
config.read('configbc.ini')
db_config = config['database']
app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_config['username']}:{db_config['password']}@{db_config['host']}:{db_config['port']}/{db_config['dbname']}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = sqlalchemy(app)

@app.route('/stations')
def get_stations():
    sql = 'SELECT * FROM stations'
    result = db.engine.execute(sql)
    stations = [dict(row) for row in result]
    return jsonify(stations)


@app.route('/')
def root():
    return app.send_static_file('index.html')

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0",port=8080)