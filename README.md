# R3 Access — Controle de acesso por QR Code

Sistema de controle de acesso à portaria da **R3 Suprimentos**: colaboradores, vendedores, clientes e visitantes recebem um QR Code, e o porteiro valida a entrada lendo o código pela câmera do celular.

**Produção:** https://r3-access.vercel.app

## Stack

- [Next.js 15](https://nextjs.org) (App Router) + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (banco PostgreSQL)
- Leitura de QR/código de barras: `jsQR`, `@zxing/browser`, `react-webcam`
- Geração de QR: `qrcode`
- `bcryptjs` / `crypto-js` (senhas e tokens)

## Como rodar

```bash
npm install
# crie .env.local com as variáveis abaixo
npm run dev      # http://localhost:3000
```

> A câmera do navegador só funciona em `localhost` ou HTTPS. Para testar no celular, use o deploy ou um túnel HTTPS.

### Variáveis de ambiente (`.env.local`)

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon) do Supabase |

### Banco de dados

Rode os scripts SQL no Supabase, nesta ordem:

1. `database/create_database_schema.sql` (ou `create_basic_tables.sql` para o mínimo)
2. `database/vehicle_schema.sql` (veículos)
3. `database/migrations/*.sql` (controle de primeiro acesso e perfil vendedor)

## Perfis e telas

| Rota | Quem usa | Função |
|------|----------|--------|
| `/` | Todos | Login |
| `/admin`, `/admin-portal` | Administrador | Cadastros, importação de colaboradores, gerar QR de cliente |
| `/porteiro-portal`, `/scan` | Porteiro | Leitura de QR e liberação de entrada |
| `/colaborador-portal` | Colaborador | QR pessoal de acesso |
| `/vendedor-portal` | Vendedor | QR pessoal e de clientes |
| `/gerar-qrcode-visitante` | Recepção | QR temporário para visitante |
| `/qrcode`, `/qrcode-teste` | Suporte | Visualização e teste de QR |

## Importação de colaboradores

Colaboradores podem ser importados por CSV no painel admin. Modelo em `exemplo_colaboradores.csv` e instruções em `IMPORTACAO_COLABORADORES.md`.

## Outros documentos

- `INSTRUCOES_TESTE.md` — roteiro de teste do sistema
- `DEBUG_CAMERA.md` — solução de problemas de câmera

## Deploy

Vercel — configure as variáveis do Supabase no painel do projeto.
