-- Script SQL para criar as tabelas necessárias para o sistema R3 Access
-- Execute este script no Supabase SQL Editor

-- 1. Criar tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    login VARCHAR(150) UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Hash bcrypt da senha
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('admin', 'porteiro', 'colaborador')),
    cargo VARCHAR(100),
    foto_url TEXT,
    ativo BOOLEAN DEFAULT true,
    primeiro_acesso BOOLEAN DEFAULT true,
    data_primeiro_acesso TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar tabela de tokens de acesso (otimizada para armazenamento limitado)
CREATE TABLE IF NOT EXISTS access_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    token_hash TEXT NOT NULL, -- Hash do token para validação segura
    qr_code_data TEXT, -- Dados do QRCode gerado
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar tabela de logs de acesso (compacta)
CREATE TABLE IF NOT EXISTS access_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_id UUID REFERENCES access_tokens(id) ON DELETE SET NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('token_generated', 'token_scanned', 'access_granted', 'access_denied')),
    scanner_user_id UUID REFERENCES users(id), -- Quem fez o scan (porteiro/admin)
    success BOOLEAN NOT NULL,
    error_message TEXT,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_login ON users(login);
CREATE INDEX IF NOT EXISTS idx_users_tipo ON users(tipo);
CREATE INDEX IF NOT EXISTS idx_users_ativo ON users(ativo);
CREATE INDEX IF NOT EXISTS idx_users_primeiro_acesso ON users(primeiro_acesso);

CREATE INDEX IF NOT EXISTS idx_tokens_user_id ON access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_tokens_token_hash ON access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_tokens_expires_at ON access_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_tokens_is_used ON access_tokens(is_used);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON access_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_logs_action ON access_logs(action);

-- 5. Função para limpeza automática de tokens expirados (economiza espaço)
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    -- Remove tokens expirados há mais de 1 hora
    DELETE FROM access_tokens 
    WHERE expires_at < (NOW() - INTERVAL '1 hour');
    
    -- Remove logs antigos (mantém apenas últimos 30 dias)
    DELETE FROM access_logs 
    WHERE timestamp < (NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- 6. Função para sobrescrever token de usuário (otimizada para armazenamento limitado)
CREATE OR REPLACE FUNCTION upsert_user_token(
    p_user_id UUID,
    p_token TEXT,
    p_token_hash TEXT,
    p_qr_code_data TEXT,
    p_expires_at TIMESTAMP WITH TIME ZONE
)
RETURNS UUID AS $$
DECLARE
    token_id UUID;
BEGIN
    -- Remove token anterior do mesmo usuário (se existir)
    DELETE FROM access_tokens 
    WHERE user_id = p_user_id 
    AND (is_used = false OR expires_at > NOW());
    
    -- Insere novo token
    INSERT INTO access_tokens (user_id, token, token_hash, qr_code_data, expires_at)
    VALUES (p_user_id, p_token, p_token_hash, p_qr_code_data, p_expires_at)
    RETURNING id INTO token_id;
    
    -- Log da geração do token
    INSERT INTO access_logs (user_id, token_id, action, success)
    VALUES (p_user_id, token_id, 'token_generated', true);
    
    RETURN token_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Função para validar token escaneado
CREATE OR REPLACE FUNCTION validate_scanned_token(
    p_token_hash TEXT,
    p_scanner_user_id UUID
)
RETURNS TABLE(
    is_valid BOOLEAN,
    user_data JSONB,
    token_id UUID,
    error_message TEXT
) AS $$
DECLARE
    token_record RECORD;
    user_record RECORD;
BEGIN
    -- Buscar token válido
    SELECT t.*, u.nome, u.sobrenome, u.cargo, u.foto_url
    INTO token_record
    FROM access_tokens t
    JOIN users u ON t.user_id = u.id
    WHERE t.token_hash = p_token_hash
    AND t.is_used = false
    AND t.expires_at > NOW()
    AND u.ativo = true
    LIMIT 1;
    
    -- Verificar se token foi encontrado
    IF NOT FOUND THEN
        -- Log de acesso negado
        INSERT INTO access_logs (action, success, error_message, scanner_user_id)
        VALUES ('access_denied', false, 'Token inválido ou expirado', p_scanner_user_id);
        
        RETURN QUERY SELECT false, NULL::JSONB, NULL::UUID, 'Token inválido ou expirado';
        RETURN;
    END IF;
    
    -- Marcar token como usado
    UPDATE access_tokens 
    SET is_used = true, used_at = NOW()
    WHERE id = token_record.id;
    
    -- Log de acesso concedido
    INSERT INTO access_logs (user_id, token_id, action, success, scanner_user_id)
    VALUES (token_record.user_id, token_record.id, 'access_granted', true, p_scanner_user_id);
    
    -- Retornar dados do usuário
    RETURN QUERY SELECT 
        true,
        jsonb_build_object(
            'id', token_record.user_id,
            'nome', token_record.nome,
            'sobrenome', token_record.sobrenome,
            'cargo', token_record.cargo,
            'foto_url', token_record.foto_url
        ),
        token_record.id,
        NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 9. Política RLS (Row Level Security) - opcional, para maior segurança
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- 10. Dados iniciais de exemplo
INSERT INTO users (nome, sobrenome, login, password, tipo, cargo) VALUES
('Administrador', 'Sistema', 'admin', '$2a$10$example.hash.here', 'admin', 'Administrador do Sistema'),
('João', 'Silva', 'joao.silva', '$2a$10$example.hash.here', 'porteiro', 'Porteiro Principal'),
('Maria', 'Santos', 'maria.santos', '$2a$10$example.hash.here', 'colaborador', 'Analista de Sistemas')
ON CONFLICT (login) DO NOTHING;

-- 11. Criar job para limpeza automática (executar a cada hora)
-- Nota: No Supabase, você pode configurar isso via cron job ou edge functions
-- Este é um exemplo de como poderia ser configurado:

/*
SELECT cron.schedule(
    'cleanup-tokens',
    '0 * * * *', -- A cada hora
    $$SELECT cleanup_expired_tokens();$$
);
*/

-- 12. Views úteis para consultas otimizadas
CREATE OR REPLACE VIEW active_tokens AS
SELECT 
    t.id,
    t.user_id,
    t.token,
    t.expires_at,
    t.created_at,
    u.nome,
    u.sobrenome,
    u.cargo,
    EXTRACT(EPOCH FROM (t.expires_at - NOW())) as seconds_to_expire
FROM access_tokens t
JOIN users u ON t.user_id = u.id
WHERE t.is_used = false 
AND t.expires_at > NOW()
AND u.ativo = true;

CREATE OR REPLACE VIEW recent_access_logs AS
SELECT 
    l.id,
    l.action,
    l.success,
    l.timestamp,
    l.error_message,
    u.nome as user_nome,
    u.sobrenome as user_sobrenome,
    u.tipo as user_tipo,
    scanner.nome as scanner_nome,
    scanner.sobrenome as scanner_sobrenome
FROM access_logs l
LEFT JOIN users u ON l.user_id = u.id
LEFT JOIN users scanner ON l.scanner_user_id = scanner.id
WHERE l.timestamp > (NOW() - INTERVAL '24 hours')
ORDER BY l.timestamp DESC;

-- 13. Comentários nas tabelas para documentação
COMMENT ON TABLE users IS 'Tabela de usuários do sistema (admin, porteiro, colaborador)';
COMMENT ON TABLE access_tokens IS 'Tokens temporários para acesso via QRCode - otimizada para armazenamento limitado';
COMMENT ON TABLE access_logs IS 'Logs compactos das ações de acesso ao sistema';

COMMENT ON COLUMN users.primeiro_acesso IS 'Indica se o usuário precisa alterar senha no primeiro login';
COMMENT ON COLUMN access_tokens.token_hash IS 'Hash SHA-256 do token para validação segura';
COMMENT ON COLUMN access_tokens.qr_code_data IS 'Dados do QRCode em formato otimizado';

-- 14. Verificar estrutura criada
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'access_tokens', 'access_logs')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
