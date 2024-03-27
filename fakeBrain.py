import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
import pandas as pd
df = pd.read_csv('stations_data.csv', sep=',')

y_set = pd.DataFrame(df['available_bike_stands']>0)

x_set =df.select_dtypes(include=['number'])
print(f"x_set shape: {x_set.shape}")
#x_set = df.drop(['available_bike_stands',"name","weather_desc","weather_brief",], axis=1)
train_x = x_set.sample(frac=.5, replace=True)

remainder_df = df.drop(train_x.index)

# For the remainder dataset, separate X and Y as you did initially
remainder_df = df.drop(train_x.index)
remainder_x = remainder_df.select_dtypes(include=['number'])
remainder_y = remainder_df['available_bike_stands']>0

y_train = y_set.loc[train_x.index]


model = tf.keras.Sequential([
      tf.keras.layers.Normalization(input_shape=[11,], axis=None),
      # tf.keras.layers.Dense(8, activation='relu'),
       tf.keras.layers.Dense(7, activation='relu'),
      # tf.keras.layers.Dense(6, activation='relu'),
      tf.keras.layers.Dense(5, activation='relu'),
      tf.keras.layers.Dense(5)
  ])
# Add the hidden layers

# Add the output layer


# Compile the model
model.compile(optimizer='adam', loss='mean_squared_error',metrics=['accuracy'])
model.fit(train_x, y_train, epochs=2)
print("hi")
evaluation = model.evaluate(remainder_x, remainder_y, verbose=2)
print(f"Model evaluation on remainder set: {evaluation}")

# Model summary

