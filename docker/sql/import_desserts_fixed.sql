-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert data directly from JSON file
INSERT INTO desserts (id, name, description, price, info, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    item->>'name',
    item->>'description',
    (item->>'price')::decimal,
    item->>'info',
    NOW(),
    NOW()
FROM 
    jsonb_array_elements(
        pg_read_file('/docker-entrypoint-initdb.d/desserts_fixed.json')::jsonb
    ) as item;
