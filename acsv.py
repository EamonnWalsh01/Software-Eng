import pandas as pd
def map_to_five(x):
    return min(x, 5)
df = pd.read_csv('stations_data.csv', sep=',')
y_set = pd.DataFrame(df['available_bike_stands']>0)
x_set =df.select_dtypes(include=['number'])
print((y_set!=0).sum()/y_set.sum())
