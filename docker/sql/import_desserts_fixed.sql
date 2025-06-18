-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a temporary table to hold the JSON data
CREATE TEMP TABLE temp_desserts (data jsonb);

-- Load the JSON file into the temporary table
\copy temp_desserts FROM '/docker-entrypoint-initdb.d/desserts_fixed.json';

-- Insert data into the desserts table
INSERT INTO desserts (id, name, description, price, info, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    data->>'name',
    data->>'description',
    (data->>'price')::decimal,
    data->>'info',
    NOW(),
    NOW()
FROM 
    (SELECT jsonb_array_elements(data) as data FROM temp_desserts) as json_data;

-- Clean up
DROP TABLE temp_desserts;
