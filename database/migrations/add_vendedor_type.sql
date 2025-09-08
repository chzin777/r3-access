-- Migração para adicionar o tipo 'vendedor' na tabela users
-- Execute este script no Supabase SQL Editor

-- 1. Primeiro, remover a constraint existente
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tipo_check;

-- 2. Adicionar a nova constraint com o tipo 'vendedor'
ALTER TABLE users ADD CONSTRAINT users_tipo_check 
CHECK (tipo IN ('admin', 'porteiro', 'colaborador', 'vendedor'));

-- 3. Verificar se a alteração foi aplicada corretamente
SELECT 
    conname as constraint_name,
    consrc as constraint_definition
FROM pg_constraint 
WHERE conname = 'users_tipo_check';

-- 4. Opcional: Atualizar usuários existentes que deveriam ser vendedores
-- com base no cargo (descomente se necessário)
/*
UPDATE users SET tipo = 'vendedor' 
WHERE tipo = 'colaborador' 
AND (
    LOWER(cargo) LIKE '%vendas%' OR
    LOWER(cargo) LIKE '%vendedor%' OR
    LOWER(cargo) LIKE '%vendedora%' OR
    LOWER(cargo) LIKE '%comercial%' OR
    LOWER(cargo) LIKE '%representante%'
);
*/

-- 5. Verificar tipos existentes
SELECT tipo, COUNT(*) as quantidade 
FROM users 
GROUP BY tipo 
ORDER BY tipo;
