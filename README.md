# DevUp

MVP SaaS para diagnostico de carreira dev e plano de estudos personalizado com IA.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- OpenAI API
- PDFKit
- Vitest

## Rodando localmente

1. Copie `.env.example` para `.env` e preencha `OPENAI_API_KEY`, `ADMIN_ACCESS_KEY` e `AUTH_SECRET`.
2. Suba o banco:

```bash
docker compose up -d
```

3. Instale dependencias e gere o cliente Prisma:

```bash
npm install
npm run prisma:generate
```

4. Crie as tabelas:

```bash
npm run prisma:migrate
```

5. Rode o app:

```bash
npm run dev
```

Boas-vindas: `http://localhost:3000`.

Login: `http://localhost:3000/login`.

Formulario autenticado: `http://localhost:3000/diagnostico`.

Em desenvolvimento, os magic links tambem aparecem na tela apos solicitar acesso quando `EMAIL_DELIVERY_MODE="console"`.

## Magic link com Brevo

Para disparar magic links pela Brevo:

1. Crie uma API key transacional na Brevo.
2. Cadastre e valide um remetente transacional.
3. Configure no `.env`:

```bash
EMAIL_DELIVERY_MODE="brevo"
BREVO_API_KEY="sua-api-key"
BREVO_SENDER_EMAIL="seu-remetente@dominio.com"
BREVO_SENDER_NAME="DevUp"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

O envio usa a API transacional da Brevo em `https://api.brevo.com/v3/smtp/email`.

## Administrador

A area administrativa fica em `http://localhost:3000/admin`.

Use a chave configurada em `ADMIN_ACCESS_KEY` para entrar. Por la voce pode criar, editar, desativar ou remover perguntas do formulario publico sem alterar codigo.
