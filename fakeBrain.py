from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
import pandas as pd
from datetime import datetime
import numpy as np

df = pd.read_csv('stations_data.csv', sep=',')
def map_to_five(x):
    return min(x, 5)
df['rounded_last_update'] = pd.to_datetime(df['rounded_last_update'])
df['time_as_fraction'] = df['rounded_last_update'].dt.hour * 3600 + df['rounded_last_update'].dt.minute * 60 + df['rounded_last_update'].dt.second

# Step 2: Convert these seconds to a fraction of the day
df['time_as_fraction'] = df['time_as_fraction'] / 86400
# Applying the function to the 'available_bike_stands' column
y_set = pd.DataFrame(df['available_bike_stands'])#.apply(map_to_five))

x_set =df.select_dtypes(include=['number'])
print(df.columns)
#x_set = df[['number','time_as_fraction','temp','feels_like']]
#x_set = df.drop(['available_bike_stands',"name","weather_desc","weather_brief",], axis=1)
#x_set = df[['number','time_as_fraction','temp','feels_like']]
train_x = x_set.sample(frac=.9, replace=True)


# For the remainder dataset, separate X and Y as you did initially
remainder_df = df.drop(train_x.index)
remainder_x = remainder_df.select_dtypes(include=['number'])
remainder_y = remainder_df['available_bike_stands']#.apply(map_to_five)

y_train = y_set.loc[train_x.index]


model = tf.keras.Sequential([
      tf.keras.layers.Normalization(input_shape=[12,], axis=None),
       tf.keras.layers.Dense(10, activation='relu'),
       tf.keras.layers.Dense(10, activation='relu'),
       #tf.keras.layers.Dense(1000, activation='relu'),
      #tf.keras.layers.Dense(1000, activation='relu'),
       #     tf.keras.layers.Dense(1000, activation='relu'),
     
      tf.keras.layers.Dense(1, activation='sigmoid', use_bias=True)
  ])
# Add the hidden layers

# Add the output layer


# Compile the model
model.compile(optimizer='adam', loss='mean_squared_error',metrics=['accuracy'])
model.fit(train_x, y_train, epochs=20,batch_size=50)
print("hi")
evaluation = model.evaluate(remainder_x, remainder_y, verbose=2)
print(f"Model evaluation on remainder set: {evaluation}")

# Model summary

