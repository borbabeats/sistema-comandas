-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a temporary table to hold the JSON data
CREATE TEMP TABLE temp_beverages (data jsonb);

-- Load the JSON file into the temporary table
\copy temp_beverages FROM '/docker-entrypoint-initdb.d/beverages_fixed.json';

-- Insert data into the beverages table
INSERT INTO beverages (id, name, description, price, category, info, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    data->>'name',
    data->>'description',
    (data->>'price')::decimal,
    data->>'category',
    data->>'info',
    NOW(),
    NOW()
FROM 
    (SELECT jsonb_array_elements(data) as data FROM temp_beverages) as json_data;

-- Clean up
DROP TABLE temp_beverages;
