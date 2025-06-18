-- Cria o usuário admin se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
        CREATE USER admin WITH PASSWORD 'admin' SUPERUSER;
    END IF;
END
$$;

-- Cria o banco de dados se não existir
SELECT 'CREATE DATABASE comandas'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'comandas')\gexec

-- Conecta ao banco de dados
\c comandas

-- Garante que o usuário admin tenha todas as permissões
GRANT ALL PRIVILEGES ON DATABASE comandas TO admin;

-- Habilita a extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";