import requests
import json

# Your API key (replace 'YOUR_API_KEY' with your actual API key)
api_key = 'ca224502e7a2a285e6b4bf2e73ddf465'

# Location for which you want the weather data (e.g., "London,uk")
location = 'Dublin,ireland'

# Build the URL for the API request
url = f'http://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key}'

# Make the GET request to the OpenWeatherMap API
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    # Parse the JSON response
    data = response.json()
    with open('weather_data.json', 'w') as file:
        json.dump(data, file, indent=4)
    # Extract the information you're interested in
    # Example: get the temperature, humidity, and weather description
    temperature = data['main']['temp']
    humidity = data['main']['humidity']
    weather_description = data['weather'][0]['description']
    
    
else:
    print("Failed to retrieve data")
