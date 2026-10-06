import { gerarDesenho, numeroValido } from "../../lib/desenho.js";

function respostaJson(status, mensagem, cabecalhos = {}) {
  return new Response(JSON.stringify({ erro: mensagem }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...cabecalhos,
    },
  });
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== "POST") {
    return respostaJson(405, "Método não permitido.", { Allow: "POST" });
  }

  let corpo;
  try {
    corpo = await request.json();
  } catch {
    return respostaJson(400, "Corpo JSON inválido.");
  }

  if (
    corpo === null ||
    typeof corpo !== "object" ||
    Array.isArray(corpo) ||
    !numeroValido(corpo.numero)
  ) {
    return respostaJson(400, "Informe um número inteiro entre 1 e 100.");
  }

  const correspondenciaToken = request.headers.get("Authorization")?.match(/^Bearer\s+(\S+)$/i);
  const token = correspondenciaToken?.[1];
  if (!token) {
    return respostaJson(401, "Token Google ausente ou inválido.");
  }

  if (!env.GOOGLE_CLIENT_ID) {
    console.error("A variável GOOGLE_CLIENT_ID não está configurada.");
    return respostaJson(500, "Serviço de autenticação não configurado.");
  }

  const urlTokenInfo = new URL("https://oauth2.googleapis.com/tokeninfo");
  urlTokenInfo.searchParams.set("id_token", token);

  let respostaGoogle;
  try {
    respostaGoogle = await fetch(urlTokenInfo, { signal: AbortSignal.timeout(5000) });
  } catch (erro) {
    console.error("Não foi possível verificar o token com o Google:", erro);
    return respostaJson(502, "Não foi possível verificar a autenticação com o Google.");
  }

  if (!respostaGoogle.ok) {
    return respostaJson(401, "Token Google inválido ou expirado.");
  }

  let identidade;
  try {
    identidade = await respostaGoogle.json();
  } catch {
    return respostaJson(401, "Resposta de autenticação inválida.");
  }

  if (identidade === null || typeof identidade !== "object" || Array.isArray(identidade)) {
    return respostaJson(401, "Resposta de autenticação inválida.");
  }

  if (
    identidade.aud !== env.GOOGLE_CLIENT_ID ||
    identidade.email_verified !== "true" ||
    typeof identidade.email !== "string" ||
    identidade.email.length === 0
  ) {
    return respostaJson(401, "A conta Google não foi verificada para este site.");
  }

  const svg = gerarDesenho(corpo.numero, identidade.email);
  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
