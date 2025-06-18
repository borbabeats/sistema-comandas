-- Script para adicionar a coluna 'info' às tabelas necessárias

-- Adiciona a coluna 'info' na tabela beverages se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'beverages' AND column_name = 'info') THEN
        ALTER TABLE beverages ADD COLUMN info TEXT;
    END IF;
END
$$;

-- Adiciona a coluna 'info' na tabela plates se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'plates' AND column_name = 'info') THEN
        ALTER TABLE plates ADD COLUMN info TEXT;
    END IF;
END
$$;

-- Adiciona a coluna 'info' na tabela desserts se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'desserts' AND column_name = 'info') THEN
        ALTER TABLE desserts ADD COLUMN info TEXT;
    END IF;
END
$$;

-- Adiciona a coluna 'info' na tabela orders se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'orders' AND column_name = 'info') THEN
        ALTER TABLE orders ADD COLUMN info TEXT;
    END IF;
END
$$;
