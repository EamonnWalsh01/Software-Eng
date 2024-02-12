CREATE TABLE availability (
number INTEGER NOT NULL,
last_update DATETIME NOT NULL,
available_bikes INTEGER,
available_bike_stands INTEGER,
status VARCHAR(128),
PRIMARY KEY (number, last_update)
);

CREATE TABLE station (
number INTEGER NOT NULL,
address VARCHAR(128),
banking INTEGER,
bike_stands INTEGER,
name VARCHAR(128),
position_lat FLOAT,
position_lng FLOAT,
PRIMARY KEY (number)
);