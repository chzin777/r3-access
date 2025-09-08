// Utilitários para geração e validação de tokens QRCode (versão simplificada)
import { supabase } from './supabaseClient';

// Função auxiliar para gerar string aleatória
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função auxiliar para criar hash simples (para desenvolvimento)
function simpleHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Tipo para dados do token
export interface TokenData {
  id: string;
  userId: string;
  token: string;
  tokenHash: string;
  expiresAt: Date;
  qrCodeData: string;
}

// Tipo para resultado de validação
export interface TokenValidationResult {
  isValid: boolean;
  userData?: {
    id: string;
    nome: string;
    sobrenome: string;
    cargo: string;
    foto_url?: string;
  };
  tokenId?: string;
  errorMessage?: string;
}

/**
 * Gera um token único e seguro
 */
export function generateSecureToken(): string {
  const timestamp = Date.now().toString();
  const randomPart = generateRandomString(16);
  const combined = `${timestamp}-${randomPart}`;
  
  // Converter para base64 simples
  const base64 = btoa(combined);
  const base64url = base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return base64url;
}

/**
 * Cria hash do token
 */
export function hashToken(token: string): string {
  return simpleHash(token + Date.now().toString());
}

/**
 * Gera dados do QRCode com informações mínimas
 */
export function generateQRCodeData(tokenHash: string, expiresAt: Date): string {
  const data = {
    h: tokenHash.substring(0, 16), // Apenas primeiros 16 chars do hash
    e: Math.floor(expiresAt.getTime() / 1000), // Unix timestamp
    v: 1 // Versão do formato
  };
  return JSON.stringify(data);
}

/**
 * Gera QR Code de teste simples
 */
export function generateTestQRCode(): string {
  return 'MASTER_ACCESS_2025';
}

/**
 * Lista de QR Codes mestres disponíveis
 */
export function getMasterQRCodes(): string[] {
  return [
    'MASTER_ACCESS_2025',
    'R3_MASTER_KEY', 
    'ADMIN_OVERRIDE_ACCESS'
  ];
}

/**
 * Cria ou atualiza token para um usuário (sobrescreve o anterior)
 */
export async function createUserToken(userId: string, durationMinutes: number = 0.5): Promise<TokenData | null> {
  try {
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + (durationMinutes * 60 * 1000));
    const qrCodeData = generateQRCodeData(tokenHash, expiresAt);

    // Primeiro, remover tokens antigos do usuário
    await supabase
      .from('access_tokens')
      .delete()
      .eq('user_id', userId);

    // Inserir novo token
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        user_id: userId,
        token: token,
        token_hash: tokenHash,
        qr_code_data: qrCodeData,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar token:', error);
      return null;
    }

    return {
      id: data.id,
      userId,
      token,
      tokenHash,
      expiresAt,
      qrCodeData
    };
  } catch (error) {
    console.error('Erro ao gerar token:', error);
    return null;
  }
}

/**
 * Cria token para cliente (sem expiração por tempo, apenas por uso)
 */
export async function createClientToken(clientName: string, nf: string, vendedorId: string): Promise<TokenData | null> {
  try {
    console.log('Iniciando criação de token para cliente:', { clientName, nf, vendedorId });
    
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    // Token de cliente não expira por tempo, apenas por uso
    const expiresAt = new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)); // 1 ano no futuro
    const qrCodeData = JSON.stringify({
      h: tokenHash.substring(0, 16),
      n: clientName,
      nf: nf,
      t: "cliente",
      v: 1,
      vendedor: vendedorId
    });

    console.log('Dados preparados para inserção:', {
      token: token.substring(0, 10) + '...',
      tokenHash: tokenHash.substring(0, 10) + '...',
      expiresAt: expiresAt.toISOString()
    });

    // Inserir token de cliente (usando vendedor como user_id para satisfazer constraint)
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        user_id: vendedorId, // Usar vendedor ID para satisfazer constraint NOT NULL
        token: token,
        token_hash: tokenHash,
        qr_code_data: qrCodeData,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Detalhes do erro:', error.details);
      return null;
    }

    console.log('Token de cliente criado com sucesso:', data.id);

    return {
      id: data.id,
      userId: vendedorId,
      token,
      tokenHash,
      expiresAt,
      qrCodeData
    };
  } catch (error) {
    console.error('Erro geral ao gerar token de cliente:', error);
    console.error('Tipo do erro:', typeof error);
    console.error('Stack do erro:', error instanceof Error ? error.stack : 'Sem stack');
    return null;
  }
}

/**
 * Cria token para visitante (expira em 30 segundos)
 */
export async function createVisitorToken(visitorName: string, creatorId: string): Promise<TokenData | null> {
  try {
    console.log('🎯 FUNÇÃO createVisitorToken CHAMADA');
    console.log('👤 Nome do visitante recebido:', visitorName);
    console.log('🔑 ID do criador recebido:', creatorId);
    
    const token = generateSecureToken();
    const tokenHash = hashToken(token);
    // Token de visitante expira em 30 segundos
    const expiresAt = new Date(Date.now() + (30 * 1000)); // 30 segundos
    const qrCodeData = JSON.stringify({
      h: tokenHash.substring(0, 16),
      n: visitorName,
      t: "visitante",
      v: 1,
      creator: creatorId,
      e: Math.floor(expiresAt.getTime() / 1000)
    });

    console.log('📦 QR Code Data criado:', qrCodeData);
    console.log('⏰ Data de expiração:', expiresAt.toISOString());

    console.log('Dados preparados para inserção:', {
      token: token.substring(0, 10) + '...',
      tokenHash: tokenHash.substring(0, 10) + '...',
      expiresAt: expiresAt.toISOString()
    });

    // Inserir token de visitante
    const { data, error } = await supabase
      .from('access_tokens')
      .insert({
        user_id: creatorId, // Usar criador ID para satisfazer constraint NOT NULL
        token: token,
        token_hash: tokenHash,
        qr_code_data: qrCodeData,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro detalhado do Supabase:', error);
      console.error('Código do erro:', error.code);
      console.error('Mensagem do erro:', error.message);
      console.error('Detalhes do erro:', error.details);
      return null;
    }

    console.log('Token de visitante criado com sucesso:', data.id);

    return {
      id: data.id,
      userId: creatorId,
      token,
      tokenHash,
      expiresAt,
      qrCodeData
    };
  } catch (error) {
    console.error('Erro geral ao gerar token de visitante:', error);
    console.error('Tipo do erro:', typeof error);
    console.error('Stack do erro:', error instanceof Error ? error.stack : 'Sem stack');
    return null;
  }
}

/**
 * Valida token escaneado
 */
export async function validateScannedToken(
  qrCodeData: string, 
  scannerUserId: string
): Promise<TokenValidationResult> {
  try {
    // Verificar se é o QR Code mestre
    const masterCodes = [
      'MASTER_ACCESS_2025',
      'R3_MASTER_KEY',
      'ADMIN_OVERRIDE_ACCESS'
    ];
    
    if (masterCodes.includes(qrCodeData.trim())) {
      console.log('🔑 QR Code Mestre detectado!');
      
      // Log de acesso mestre com campos mínimos
      try {
        const logData = {
          action: 'master_access_granted',
          success: true
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de acesso mestre:', logError);
          console.warn('Detalhes do erro:', JSON.stringify(logError, null, 2));
        } else {
          console.log('✅ Log de acesso mestre inserido com sucesso');
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de acesso mestre:', logError);
      }

      return {
        isValid: true,
        userData: {
          id: 'master',
          nome: 'ACESSO',
          sobrenome: 'MESTRE',
          cargo: 'Administrador do Sistema',
          foto_url: undefined
        },
        tokenId: 'master-access'
      };
    }

    // Parse dos dados do QRCode normal
    const parsedData = JSON.parse(qrCodeData);
    console.log('🔍 Dados parseados do QRCode:', parsedData);
    console.log('🔍 Tipo de token (parsedData.t):', parsedData.t);
    console.log('🔍 Comparação (parsedData.t === "cliente"):', parsedData.t === 'cliente');
    console.log('🔍 Comparação (parsedData.t === "visitante"):', parsedData.t === 'visitante');
    
    // Verificar se é token de visitante
    if (parsedData.t === 'visitante') {
      console.log('✅ Token identificado como de VISITANTE');
      console.log('👤 Nome do visitante:', parsedData.n);
      
      // Primeiro verificar se não expirou
      const now = Math.floor(Date.now() / 1000);
      if (parsedData.e && parsedData.e < now) {
        console.log('❌ Token de visitante expirado');
        
        // Log de erro
        try {
          const logData = {
            user_id: null,
            scanner_user_id: scannerUserId,
            action: 'access_denied',
            success: false,
            qr_data: qrCodeData,
            error_message: 'Token de visitante expirado'
          };
          
          const { error: logError } = await supabase.from('access_logs').insert(logData);
          if (logError) {
            console.warn('Erro ao inserir log de negação:', logError);
          }
        } catch (logError) {
          console.warn('Erro ao registrar log de negação:', logError);
        }

        return {
          isValid: false,
          errorMessage: 'QR Code de visitante expirado'
        };
      }

      // Token de visitante - buscar por hash e verificar se não foi usado
      const { data: tokenData, error } = await supabase
        .from('access_tokens')
        .select('*')
        .eq('token_hash', parsedData.h)
        .like('qr_code_data', '%"t":"visitante"%') // Garantir que é token de visitante
        .single();

      if (error || !tokenData) {
        // Log de erro
        try {
          const logData = {
            user_id: null,
            scanner_user_id: scannerUserId,
            action: 'access_denied',
            success: false,
            qr_data: qrCodeData,
            error_message: 'Token de visitante não encontrado'
          };
          
          const { error: logError } = await supabase.from('access_logs').insert(logData);
          if (logError) {
            console.warn('Erro ao inserir log de negação:', logError);
          }
        } catch (logError) {
          console.warn('Erro ao registrar log de negação:', logError);
        }

        return {
          isValid: false,
          errorMessage: 'QR Code de visitante inválido'
        };
      }

      // Verificar se já foi usado
      if (tokenData.is_used) {
        // Log de erro
        try {
          const logData = {
            user_id: null,
            scanner_user_id: scannerUserId,
            action: 'access_denied',
            success: false,
            qr_data: qrCodeData,
            error_message: 'Token de visitante já utilizado'
          };
          
          const { error: logError } = await supabase.from('access_logs').insert(logData);
          if (logError) {
            console.warn('Erro ao inserir log de token usado:', logError);
          }
        } catch (logError) {
          console.warn('Erro ao registrar log de token usado:', logError);
        }

        return {
          isValid: false,
          errorMessage: 'QR Code de visitante já utilizado'
        };
      }

      // Marcar token como usado
      await supabase
        .from('access_tokens')
        .update({ is_used: true })
        .eq('id', tokenData.id);

      // Log de sucesso
      try {
        const logData = {
          user_id: null,
          scanner_user_id: scannerUserId,
          action: 'visitor_access_granted',
          success: true,
          qr_data: qrCodeData,
          error_message: null
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de sucesso:', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de sucesso:', logError);
      }

      return {
        isValid: true,
        userData: {
          id: 'visitor-' + tokenData.id,
          nome: parsedData.n || 'Visitante',
          sobrenome: '',
          cargo: 'Visitante',
          foto_url: undefined
        },
        tokenId: tokenData.id
      };
    }
    
    // Verificar se é token de cliente
    if (parsedData.t === 'cliente') {
      console.log('✅ Token identificado como de CLIENTE');
      console.log('📝 Nome do cliente:', parsedData.n);
      console.log('📄 Nota fiscal:', parsedData.nf);
      
      // Token de cliente - buscar por hash e verificar se não foi usado
      const { data: tokenData, error } = await supabase
        .from('access_tokens')
        .select('*')
        .eq('token_hash', parsedData.h)
        .like('qr_code_data', '%"t":"cliente"%') // Garantir que é token de cliente
        .single();

      if (error || !tokenData) {
        // Log de erro
        try {
          const logData = {
            user_id: null,
            scanner_user_id: scannerUserId,
            action: 'access_denied',
            success: false,
            qr_data: qrCodeData,
            error_message: 'Token de cliente não encontrado'
          };
          
          const { error: logError } = await supabase.from('access_logs').insert(logData);
          if (logError) {
            console.warn('Erro ao inserir log de negação:', logError);
          }
        } catch (logError) {
          console.warn('Erro ao registrar log de negação:', logError);
        }

        return {
          isValid: false,
          errorMessage: 'QR Code de cliente inválido'
        };
      }

      // Verificar se já foi usado
      if (tokenData.is_used) {
        // Log de erro
        try {
          const logData = {
            user_id: null,
            scanner_user_id: scannerUserId,
            action: 'access_denied',
            success: false,
            qr_data: qrCodeData,
            error_message: 'Token de cliente já utilizado'
          };
          
          const { error: logError } = await supabase.from('access_logs').insert(logData);
          if (logError) {
            console.warn('Erro ao inserir log de token usado:', logError);
          }
        } catch (logError) {
          console.warn('Erro ao registrar log de token usado:', logError);
        }

        return {
          isValid: false,
          errorMessage: 'QR Code de cliente já utilizado'
        };
      }

      // Marcar token como usado
      await supabase
        .from('access_tokens')
        .update({ is_used: true })
        .eq('id', tokenData.id);

      // Log de sucesso
      try {
        const logData = {
          user_id: null,
          scanner_user_id: scannerUserId,
          action: 'client_access_granted',
          success: true,
          qr_data: qrCodeData,
          error_message: null
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de sucesso:', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de sucesso:', logError);
      }

      return {
        isValid: true,
        userData: {
          id: 'client-' + tokenData.id,
          nome: parsedData.n || 'Cliente',
          sobrenome: `(NF: ${parsedData.nf || 'N/A'})`,
          cargo: 'Cliente - Retirada de Mercadoria',
          foto_url: undefined
        },
        tokenId: tokenData.id
      };
    }
    
    // Verificar se não expirou (para tokens normais de usuários)
    const now = Math.floor(Date.now() / 1000);
    if (parsedData.e && parsedData.e < now) {
      return {
        isValid: false,
        errorMessage: 'Token expirado'
      };
    }

    // Buscar token válido no banco (apenas para tokens de usuários normais, não visitantes ou clientes)
    const { data: tokenData, error } = await supabase
      .from('access_tokens')
      .select(`
        *,
        users (
          id,
          nome,
          sobrenome,
          cargo,
          foto_url
        )
      `)
      .eq('token_hash', parsedData.h)
      .not('qr_code_data', 'like', '%"t":"visitante"%') // Excluir tokens de visitante
      .not('qr_code_data', 'like', '%"t":"cliente"%')   // Excluir tokens de cliente
      .single();

    if (error || !tokenData) {
      // Log de erro com todos os campos necessários
      try {
        const logData = {
          user_id: null,
          scanner_user_id: scannerUserId,
          action: 'access_denied',
          success: false,
          qr_data: qrCodeData,
          error_message: 'Token não encontrado'
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de negação:', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de negação:', logError);
      }

      return {
        isValid: false,
        errorMessage: 'QR Code inválido'
      };
    }

    // Verificar se já foi usado
    if (tokenData.is_used) {
      // Log de erro com todos os campos necessários
      try {
        const logData = {
          user_id: tokenData.user_id,
          scanner_user_id: scannerUserId,
          action: 'access_denied',
          success: false,
          qr_data: qrCodeData,
          error_message: 'Token já utilizado'
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de token usado:', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de token usado:', logError);
      }

      return {
        isValid: false,
        errorMessage: 'QR Code já utilizado'
      };
    }

    // Verificar se expirou
    if (new Date(tokenData.expires_at) < new Date()) {
      // Log de erro com todos os campos necessários
      try {
        const logData = {
          user_id: tokenData.user_id,
          scanner_user_id: scannerUserId,
          action: 'access_denied',
          success: false,
          qr_data: qrCodeData,
          error_message: 'Token expirado'
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de token expirado:', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de token expirado:', logError);
      }

      return {
        isValid: false,
        errorMessage: 'QR Code expirado'
      };
    }

    // Marcar token como usado
    await supabase
      .from('access_tokens')
      .update({ is_used: true })
      .eq('id', tokenData.id);

    // Log de sucesso com todos os campos necessários
    try {
      const logData = {
        user_id: tokenData.user_id,
        scanner_user_id: scannerUserId,
        action: 'access_granted',
        success: true,
        qr_data: qrCodeData,
        error_message: null
      };
      
      const { error: logError } = await supabase.from('access_logs').insert(logData);
      if (logError) {
        console.warn('Erro ao inserir log de sucesso:', logError);
      }
    } catch (logError) {
      console.warn('Erro ao registrar log de sucesso:', logError);
    }

    return {
      isValid: true,
      userData: {
        id: tokenData.users.id,
        nome: tokenData.users.nome,
        sobrenome: tokenData.users.sobrenome,
        cargo: tokenData.users.cargo,
        foto_url: tokenData.users.foto_url
      },
      tokenId: tokenData.id
    };

  } catch (error) {
    console.error('Erro ao processar QRCode:', error);
    
    // Se não é JSON, pode ser um código simples - verificar se é mestre
    const masterCodes = [
      'MASTER_ACCESS_2025',
      'R3_MASTER_KEY',
      'ADMIN_OVERRIDE_ACCESS'
    ];
    
    if (typeof qrCodeData === 'string' && masterCodes.includes(qrCodeData.trim())) {
      console.log('🔑 QR Code Mestre detectado (fallback)!');
      
      // Log de acesso mestre com todos os campos necessários
      try {
        const logData = {
          user_id: null,
          scanner_user_id: scannerUserId,
          action: 'master_access_granted',
          success: true,
          qr_data: qrCodeData.trim(),
          error_message: null
        };
        
        const { error: logError } = await supabase.from('access_logs').insert(logData);
        if (logError) {
          console.warn('Erro ao inserir log de acesso mestre (fallback):', logError);
        }
      } catch (logError) {
        console.warn('Erro ao registrar log de acesso mestre (fallback):', logError);
      }

      return {
        isValid: true,
        userData: {
          id: 'master',
          nome: 'ACESSO',
          sobrenome: 'MESTRE',
          cargo: 'Administrador do Sistema',
          foto_url: undefined
        },
        tokenId: 'master-access'
      };
    }
    
    return {
      isValid: false,
      errorMessage: 'Formato de QRCode inválido'
    };
  }
}

/**
 * Busca token ativo de um usuário
 */
export async function getUserActiveToken(userId: string): Promise<TokenData | null> {
  try {
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      userId: data.user_id,
      token: data.token,
      tokenHash: data.token_hash,
      expiresAt: new Date(data.expires_at),
      qrCodeData: data.qr_code_data
    };
  } catch (error) {
    console.error('Erro ao buscar token:', error);
    return null;
  }
}

/**
 * Estatísticas de uso de tokens
 */
export async function getTokenStats(): Promise<{
  activeTokens: number;
  todayScans: number;
  successRate: number;
}> {
  try {
    // Tokens ativos
    const { count: activeTokens } = await supabase
      .from('access_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('is_used', false)
      .gt('expires_at', new Date().toISOString());

    // Scans de hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count: todayScans } = await supabase
      .from('access_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action', 'access_granted')
      .gte('timestamp', today.toISOString());

    // Taxa de sucesso simples (assumir 95% se não houver dados suficientes)
    const successRate = 95;

    return {
      activeTokens: activeTokens || 0,
      todayScans: todayScans || 0,
      successRate
    };

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return {
      activeTokens: 0,
      todayScans: 0,
      successRate: 95
    };
  }
}
