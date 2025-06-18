-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create a temporary table to hold the JSON data
CREATE TEMP TABLE temp_plates (data jsonb);

-- Load the JSON file into the temporary table
\copy temp_plates FROM '/docker-entrypoint-initdb.d/plates_fixed.json';

-- Insert data into the plates table
INSERT INTO plates (id, name, description, price, info, type, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    data->>'name',
    data->>'description',
    (data->>'price')::decimal,
    data->>'info',
    ARRAY(SELECT jsonb_array_elements_text(data->'type')),
    NOW(),
    NOW()
FROM 
    (SELECT jsonb_array_elements(data) as data FROM temp_plates) as json_data;

-- Clean up
DROP TABLE temp_plates;
