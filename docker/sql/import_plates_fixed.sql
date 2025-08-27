-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Insert data directly from JSON file
INSERT INTO plates (id, name, description, price, info, type, created_at, updated_at)
SELECT 
    uuid_generate_v4(),
    item->>'name',
    item->>'description',
    (item->>'price')::decimal,
    item->>'info',
    ARRAY(SELECT jsonb_array_elements_text(item->'type')),
    NOW(),
    NOW()
FROM 
    jsonb_array_elements(
        pg_read_file('/docker-entrypoint-initdb.d/plates_fixed.json')::jsonb
    ) as item;
