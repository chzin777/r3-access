-- Migração para adicionar controle de primeiro acesso
-- Execute este script no Supabase SQL Editor

-- Adicionar colunas para controle de primeiro acesso
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS primeiro_acesso BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS data_primeiro_acesso TIMESTAMP WITH TIME ZONE;

-- Comentários nas colunas
COMMENT ON COLUMN users.primeiro_acesso IS 'Indica se é o primeiro acesso do usuário (true = precisa alterar senha)';
COMMENT ON COLUMN users.data_primeiro_acesso IS 'Data e hora do primeiro acesso efetivo do usuário';

-- Atualizar usuários existentes para não forçar mudança de senha (opcional)
-- Se você quiser que usuários existentes também sejam obrigados a trocar senha no próximo login, comente a linha abaixo
UPDATE users SET primeiro_acesso = false WHERE created_at < NOW();

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_users_primeiro_acesso ON users(primeiro_acesso);
