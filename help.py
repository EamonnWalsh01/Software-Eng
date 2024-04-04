from sklearn.utils.class_weight import compute_class_weight
import tensorflow as tf
from tensorflow.keras import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import pandas as pd
from datetime import datetime
import numpy as np

df = pd.read_csv('stations_data.csv', sep=',')
def map_to_five(x):
    return min(x, 5)
df['rounded_last_update_5mins'] = pd.to_datetime(df['rounded_last_update_5mins'])
df['time_as_fraction'] = df['rounded_last_update_5mins'].dt.hour * 3600 + df['rounded_last_update_5mins'].dt.minute * 60 + df['rounded_last_update_5mins'].dt.second
weekday=df['rounded_last_update_5mins'].dt.dayofweek
weekdaydf = pd.get_dummies(weekday, prefix='day_of_week')
df = pd.concat([df, weekdaydf], axis=1)


# Step 2: Convert these seconds to a fraction of the day
df['time_as_fraction'] = df['time_as_fraction'] / 86400
# Applying the function to the 'available_bike_stands' column
#y_set = pd.DataFrame(df['available_bike_stands'].apply(map_to_five))
y_set = to_categorical(df['available_bike_stands'])
y_set =  pd.DataFrame(y_set)
# Ensure x_set is in the correct shape
x_set = df[['time_as_fraction','day_of_week_0','day_of_week_1','day_of_week_2','day_of_week_3','day_of_week_4','day_of_week_5','day_of_week_6','temp','feels_like']]
#x_set =df.select_dtypes(include=['number'])
print(df.columns)
#x_set = df[['number','time_as_fraction','temp','feels_like']]
#x_set = df.drop(['available_bike_stands',"name","weather_desc","weather_brief",], axis=1)
train_x = x_set.sample(frac=.9, replace=True)


# For the remainder dataset, separate X and Y as you did initially
remainder_df = df.drop(train_x.index)
remainder_x = remainder_df[['time_as_fraction','day_of_week_0','day_of_week_1','day_of_week_2','day_of_week_3','day_of_week_4','day_of_week_5','day_of_week_6','temp','feels_like']]
remainder_y = remainder_df['available_bike_stands']

y_train = y_set.loc[train_x.index]
remainder_y=y_set.loc[remainder_x.index]

model = tf.keras.Sequential([
      tf.keras.layers.Normalization(input_shape=[10,], axis=None),
       #tf.keras.layers.Dense(10, activation='relu'),
       #tf.keras.layers.Dense(10, activation='relu'),
       #tf.keras.layers.Dense(1000, activation='relu'),
      tf.keras.layers.Dense(1000, activation='relu'),
       #     tf.keras.layers.Dense(1000, activation='relu'),
     
      tf.keras.layers.Dense(41, activation='relu', use_bias=True)
  ])
# Add the hidden layers
#so i can commit
# Add the output layer

#ju
# Compile the model
model.compile(optimizer='adam', loss="categorical_crossentropy",metrics=['accuracy', 'mse'])
model.fit(train_x, y_train, epochs=20,batch_size=1)
print("hi")
evaluation = model.evaluate(remainder_x, remainder_y, verbose=2)
print(f"Model evaluation on remainder set: {evaluation}")

# Model summary