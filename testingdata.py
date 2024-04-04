import pandas as pd
df = pd.read_csv('stations_data.csv', sep=',')
def map_to_five(x):
    return min(x, 5)

# Applying the function to the 'available_bike_stands' column
y_set = pd.DataFrame(df['available_bike_stands'].apply(map_to_five))
print(y_set.value_counts())