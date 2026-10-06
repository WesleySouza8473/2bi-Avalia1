# Desenho Assinado

Aplicação que gera no servidor um desenho SVG assinado com o endereço de e-mail de uma conta Google autenticada. O cliente envia somente o número e o token de identidade; a Pages Function valida o token com o Google antes de usar o e-mail verificado.

A figura é a tabuada modular no círculo: 240 pontos igualmente espaçados numa circunferência, com cada ponto `i` ligado ao ponto `(k * i) mod 240`, em que `k = número + 1`. O número 1 produz uma cardioide; o número 2, uma nefroide.

## Estrutura

```
public/
  index.html
  script.js
  style.css
lib/
  desenho.js
functions/
  api/desenho.js
evidencias/
  exemplo.svg
```

## Configuração e publicação no Cloudflare Pages

1. O projeto Google Cloud `Desenho Assinado 2025104728` tem um OAuth Client do tipo Web application.
2. A origem `https://2bi-avalia1.pages.dev` está cadastrada em **Authorized JavaScript origins**.
3. O Client ID público fica no metadado `google-client-id` de `public/index.html`. A conta Google do estudante está cadastrada como test user; enquanto o app estiver em modo de teste, somente usuários cadastrados podem entrar.
4. No painel do projeto Cloudflare Pages, configure a variável de ambiente `GOOGLE_CLIENT_ID` com o mesmo Client ID. Não publique tokens, senhas ou arquivos `.env`.
5. O repositório é implantado pelo Cloudflare Pages com Framework preset `None`, Build command vazio e Build output directory `public`.
6. Acesse `https://2bi-avalia1.pages.dev`, entre com a conta Google cadastrada e gere o desenho.

A API `POST /api/desenho` recebe `{"numero": 42}` e o cabeçalho `Authorization: Bearer <id_token>`. Retorna SVG com status 200, erro de entrada com 400, falha de autenticação com 401 e método não permitido com 405.

## Identificação

Nome: Wesley dos Santos de Souza
RA: 2025104728
URL: https://2bi-avalia1.pages.dev
