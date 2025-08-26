-- Script SQL básico para criar as tabelas necessárias
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se a tabela users já existe e criar colunas de primeiro acesso se necessário
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- 2. Criar tabela de tokens de acesso (simples e otimizada)
CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL,
    qr_code_data TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índices básicos
CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id ON access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_expires_at ON access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_access_tokens_is_used ON access_tokens(is_used);

-- 4. Criar tabela de logs simples (opcional)
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    action VARCHAR(50),
    success BOOLEAN,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Verificar se as tabelas foram criadas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('users', 'access_tokens', 'access_logs')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
