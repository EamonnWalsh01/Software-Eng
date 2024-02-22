from flask import Flask

app = Flask(__name__, static_url_path='')

@app.route('/')
def root():
    return "Hello World"

if __name__=="__main__":
    app.run(debug=True, host="0.0.0.0",port=8080)