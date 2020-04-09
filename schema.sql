DROP TABLE IF EXISTS Books;


CREATE TABLE city (
  Id SERIAL PRIMARY KEY,
  search_querry VARCHAR(100) ,
  formatted_query VARCHAR(500) ,
  latitude NUMERIC(1000),
  longitude NUMERIC(1000),

)