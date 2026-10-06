// script.js
const formulario = document.getElementById("formulario");
const campoNumero = document.getElementById("numero");
const area = document.getElementById("desenho");
const mensagem = document.getElementById("mensagem");
const botaoBaixar = document.getElementById("baixar");
const sessao = document.getElementById("sessao");
const idCliente = document.querySelector('meta[name="google-client-id"]').content.trim();

let svgAtual = "";
let idToken = "";

function receberCredencial(resposta) {
  if (typeof resposta?.credential !== "string" || resposta.credential.length === 0) {
    mensagem.textContent = "O Google não retornou um token de autenticação válido.";
    return;
  }
  idToken = resposta.credential;
  sessao.textContent = "Conta Google conectada. Escolha um número para gerar seu desenho.";
  mensagem.textContent = "";
}

if (idCliente === "SEU_CLIENT_ID.apps.googleusercontent.com") {
  sessao.textContent = "Configure o Client ID do Google no arquivo public/index.html.";
} else {
  const inicioGoogle = Date.now();
  const iniciarGoogle = () => {
    if (!window.google?.accounts?.id) {
      if (Date.now() - inicioGoogle > 10000) {
        sessao.textContent = "Não foi possível carregar o login do Google. Recarregue a página e tente novamente.";
        return;
      }
      window.setTimeout(iniciarGoogle, 100);
      return;
    }
    window.google.accounts.id.initialize({
      client_id: idCliente,
      callback: receberCredencial,
    });
    window.google.accounts.id.renderButton(document.getElementById("google-login"), {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
    });
  };
  iniciarGoogle();
}

formulario.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  mensagem.textContent = "";

  if (!campoNumero.validity.valid || campoNumero.value.trim() === "") {
    mensagem.textContent = "Digite um número inteiro entre 1 e 100.";
    return;
  }
  if (!idToken) {
    mensagem.textContent = "Entre com sua conta Google antes de desenhar.";
    return;
  }

  const numero = Number(campoNumero.value);
  if (!Number.isInteger(numero) || numero < 1 || numero > 100) {
    mensagem.textContent = "Digite um número inteiro entre 1 e 100.";
    return;
  }

  svgAtual = "";
  area.replaceChildren();
  botaoBaixar.hidden = true;

  const botaoDesenhar = formulario.querySelector('button[type="submit"]');
  botaoDesenhar.disabled = true;
  botaoDesenhar.textContent = "Gerando...";

  try {
    const resposta = await fetch("/api/desenho", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ numero }),
    });

    if (resposta.status === 400) {
      mensagem.textContent = "Número inválido. Digite um inteiro entre 1 e 100.";
      return;
    }
    if (resposta.status === 401) {
      idToken = "";
      sessao.textContent = "Sua sessão expirou ou não foi verificada. Entre novamente com o Google.";
      mensagem.textContent = "Autenticação inválida. Entre novamente com sua conta Google.";
      return;
    }
    if (!resposta.ok) {
      mensagem.textContent = "Não foi possível gerar o desenho. Tente novamente.";
      return;
    }

    svgAtual = await resposta.text();
    area.innerHTML = svgAtual;
    botaoBaixar.hidden = false;
  } catch (erro) {
    console.error("Falha ao solicitar o desenho:", erro);
    mensagem.textContent = "Falha de conexão ao gerar o desenho. Verifique sua internet e tente novamente.";
  } finally {
    botaoDesenhar.disabled = false;
    botaoDesenhar.textContent = "Desenhar";
  }
});

botaoBaixar.addEventListener("click", () => {
  const arquivo = new Blob([svgAtual], { type: "image/svg+xml" });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url;
  link.download = `desenho-${campoNumero.value}.svg`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});
