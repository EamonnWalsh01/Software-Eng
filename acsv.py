import pandas as pd

df = pd.read_csv('stations_data.csv', sep=',')
print(df.dtypes)
x_set =df.select_dtypes(include=['number'])
print(x_set.shape)
