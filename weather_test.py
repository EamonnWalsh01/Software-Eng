import datetime

# Assuming you have the date and month
month = 4  # For example, April
day = 8    # For example, 8th

# Get the current year
current_year = datetime.datetime.now().year

# Create a datetime object with the given month, day, and current year
date_object = datetime.datetime(current_year, month, day)

# Convert the datetime object to epoch time
epoch_time = date_object.timestamp()

print("Epoch time for the given date:", epoch_time)
