# Importação de Colaboradores - Sistema R3 Access

## Visão Geral

A funcionalidade de importação de colaboradores permite adicionar múltiplos usuários ao sistema através de um arquivo CSV, automatizando o processo de cadastro em lote.

## Como Usar

### 1. Preparar o Arquivo CSV

O arquivo deve seguir o formato exato:
- **Extensão**: `.csv`
- **Separador**: Ponto e vírgula (`;`)
- **Codificação**: UTF-8 recomendado

#### Cabeçalho Obrigatório:
```
Nome;Departamento;Cargo;Data de Admissão
```

#### Exemplo de conteúdo:
```csv
Nome;Departamento;Cargo;Data de Admissão
JOÃO SILVA SANTOS;Comercial;REPRESENTANTE COMERCIAL;01/01/2024
MARIA OLIVEIRA;Administrativo;ANALISTA ADMINISTRATIVO;15/02/2024
PEDRO VENDAS;Televendas;CONSULTOR DE VENDAS INTERNAS;20/03/2024
```

### 2. Processamento Automático

O sistema irá processar automaticamente:

#### **Login**
- Formato: `nome.ultimonome`
- Exemplo: "JOÃO SILVA SANTOS" → `joao.santos`
- Remove acentos e caracteres especiais
- Converte para minúsculas

#### **Senha Padrão**
- Todos os usuários recebem a senha: `r3sup@123`
- Marcados para alteração no primeiro acesso

#### **Tipo de Usuário**
- **Vendedor**: Cargos contendo palavras-chave:
  - "vendas", "vendedor", "vendedora"
  - "comercial", "representante"
  - "consultor de vendas", "supervisor externo"
  - "coordenador comercial"
- **Colaborador**: Todos os outros cargos

### 3. Processo de Importação

1. **Acesse**: `/admin` (apenas administradores)
2. **Clique**: "Importar CSV" no card de importação
3. **Selecione**: Arquivo CSV preparado
4. **Processe**: Clique em "Processar Arquivo"
5. **Revise**: Visualize o preview dos dados
6. **Confirme**: Clique em "Confirmar Importação"

### 4. Validações Realizadas

- ✅ Formato do arquivo CSV
- ✅ Cabeçalho obrigatório presente
- ✅ Nomes válidos (não vazios)
- ✅ Login único no sistema
- ✅ Identificação automática do tipo baseado no cargo

## Configuração do Banco de Dados

Antes de usar, execute a migração:

```sql
-- Execute no Supabase SQL Editor
-- Arquivo: database/migrations/add_vendedor_type.sql

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_tipo_check;
ALTER TABLE users ADD CONSTRAINT users_tipo_check 
CHECK (tipo IN ('admin', 'porteiro', 'colaborador', 'vendedor'));
```

## Tratamento de Erros

### Erros Comuns:
- **Login duplicado**: Usuário já existe no sistema
- **Nome inválido**: Campo nome vazio ou inválido
- **Formato CSV**: Arquivo mal formatado ou separador incorreto

### Comportamento:
- ✅ Importação parcial: Usuários válidos são importados mesmo se alguns falharem
- ✅ Log detalhado: Erros específicos são mostrados para correção
- ✅ Rollback não aplicado: Importações bem-sucedidas são mantidas

## Exemplo Prático

### Arquivo de Entrada (colaboradores.csv):
```csv
Nome;Departamento;Cargo;Data de Admissão
ADRIANO CANDIDO DA SILVA;Administrativo Geral;COO;04/09/2023
ANA KAROLYNA SANTANA DA SILVA;Televendas;COMERCIAL INTERNO;25/04/2022
CAIO HENRIQUE ALVES DE MOURA;Comercial;REPRESENTANTE COMERCIAL - GRANDES CONTAS;03/06/2024
DANIELA MARTINS DINIZ;Comercial;REPRESENTANTE TÉCNICO DE VENDAS;16/08/2023
```

### Resultado Processado:
| Nome Completo | Login | Cargo | Tipo | Senha |
|---------------|-------|-------|------|--------|
| ADRIANO CANDIDO DA SILVA | adriano.silva | COO | colaborador | r3sup@123 |
| ANA KAROLYNA SANTANA DA SILVA | ana.silva | COMERCIAL INTERNO | vendedor | r3sup@123 |
| CAIO HENRIQUE ALVES DE MOURA | caio.moura | REPRESENTANTE COMERCIAL - GRANDES CONTAS | vendedor | r3sup@123 |
| DANIELA MARTINS DINIZ | daniela.diniz | REPRESENTANTE TÉCNICO DE VENDAS | vendedor | r3sup@123 |

## Segurança

- ✅ Apenas administradores podem importar
- ✅ Senhas são hasheadas com bcrypt
- ✅ Validação rigorosa de dados
- ✅ Prevenção de ataques de injeção
- ✅ Log de todas as operações

## Limitações

- **Tamanho do arquivo**: Recomendado até 1000 registros por importação
- **Processamento**: Lotes de 50 registros para evitar timeouts
- **Duplicatas**: Logins duplicados são rejeitados
- **Codificação**: Problemas com caracteres especiais podem ocorrer

## Troubleshooting

### Problema: "Cabeçalho esperado não encontrado"
**Solução**: Verificar se o cabeçalho está exatamente como: `Nome;Departamento;Cargo;Data de Admissão`

### Problema: "Login já existe"
**Solução**: Verificar se não há usuários com logins similares no sistema

### Problema: "Erro de caracteres especiais"
**Solução**: Salvar o CSV com codificação UTF-8

### Problema: "Timeout durante importação"
**Solução**: Dividir arquivo grande em lotes menores (< 500 registros)

## Monitoramento

Após a importação, verificar:
- Total de registros importados
- Lista de erros (se houver)
- Logs do sistema em `access_logs`
- Tipos de usuário atribuídos corretamente

## Manutenção

Recomenda-se:
- ✅ Backup antes de grandes importações
- ✅ Teste com arquivo pequeno primeiro
- ✅ Validação manual de alguns registros
- ✅ Limpeza periódica de logs antigos
