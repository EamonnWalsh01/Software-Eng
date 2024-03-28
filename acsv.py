import pandas as pd
import matplotlib.pyplot as plt
def map_to_five(x):
    return min(x, 5)
df = pd.read_csv('stations_data.csv', sep=',')

y_set = df['available_bike_stands']
df['rounded_last_update_5mins'] = pd.to_datetime(df['rounded_last_update_5mins'])
df['time_as_fraction'] = df['rounded_last_update_5mins'].dt.hour * 3600 + df['rounded_last_update_5mins'].dt.minute * 60 + df['rounded_last_update_5mins'].dt.second
x_set = df[['time_as_fraction']]
print(y_set)
plt.figure(figsize=(10, 6)) # Optional: Adjusts the size of the figure
plt.plot(x_set, y_set)
plt.title('Available Bike Stands Over Time')
plt.xlabel('Time as Fraction (Seconds from Midnight)')
plt.ylabel('Available Bike Stands')
plt.show()

