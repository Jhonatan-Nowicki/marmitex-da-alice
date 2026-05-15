let sacola = [];
const sacolaDiv = document.getElementById("sacola");

let bebidasData = [];
let outrosData = [];
let adicionaisData = [];
let tiposMarmita = {};
let tipoSelecionado = null;
let cardapioGlobal = null;
// DOM carregado
document.addEventListener("DOMContentLoaded", () => {
  configurarFormulario();
  configurarPagamento();

  fetch('/cardapio')
    .then(res => res.json())
    .then(cardapio => {

      cardapioGlobal = cardapio;
      tiposMarmita = cardapio.marmita.tipos;

      inserirTiposMarmita();

      bebidasData = cardapio.bebidas;
      outrosData = cardapio.outros;

      inserirQuantidades(bebidasData, "bebidas");
      inserirQuantidades(outrosData, "outros");
    });
});

function configurarFormulario() {

  document.getElementById("add-marmita").addEventListener("click", () => {
    const tamanho = pegarSelecionado("tamanhos");
    const carne = pegarSelecionado("carnes");
    const adicionaisSelecionados = adicionaisData
      .filter(item => item.quantidade > 0)
      .map(item => ({ nome: item.nome, quantidade: item.quantidade }));
    const bebidasSelecionadas = bebidasData
      .filter(item => item.quantidade > 0)
      .map(item => ({ nome: item.nome, quantidade: item.quantidade }));
    const outrosSelecionados = outrosData
      .filter(item => item.quantidade > 0)
      .map(item => ({ nome: item.nome, quantidade: item.quantidade }))
    const obs = document.getElementById("observacoes").value.trim();

    if (!tamanho || !carne) {
      alert("Selecione o tamanho e a carne da marmita.");
      return;
    }

    const item = {
      tipo: tipoSelecionado,
      tamanho,
      carne,
      adicionais: adicionaisSelecionados,
      bebidas: bebidasSelecionadas,
      outros: outrosSelecionados,
      observacao: obs
    };
    sacola.push(item);
    renderizarSacola();
    limparSelecoes();
  });
}
function inserirTiposMarmita() {
  const container = document.getElementById("tamanhos");

  container.innerHTML = `
    <div id="tipos-marmita" class="flex flex-wrap gap-2 mb-4"></div>
  `;

  const tiposDiv = document.getElementById("tipos-marmita");

  Object.keys(tiposMarmita).forEach(tipo => {

    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "btn-option";
    btn.innerText = tipo;
    btn.dataset.value = tipo;

    btn.addEventListener("click", () => {

      document.querySelectorAll("#tipos-marmita .btn-option")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");

      tipoSelecionado = tipo;

      carregarTipoMarmita(tipo);
    });

    tiposDiv.appendChild(btn);
  });
}

function carregarTipoMarmita(tipo) {
  document.getElementById("bloco-tamanhos").classList.remove("hidden");
  document.getElementById("bloco-carnes").classList.remove("hidden");
  document.getElementById("bloco-adicionais").classList.remove("hidden");

  const dados = tiposMarmita[tipo];

  inserirOpcoes(dados.tamanhos, "tamanhos");
  inserirOpcoes(dados.carnes, "carnes");

  adicionaisData = cardapioGlobal.marmita.adicionais || [];

  inserirQuantidades(adicionaisData, "adicionais");
}

function configurarPagamento() {
  const botoesPagamento = document.querySelectorAll("#pagamento-opcoes .btn-option");
  const inputForma = document.getElementById("forma_pagamento");
  const campoTroco = document.getElementById("campo-troco");
  const trocoParaInput = document.getElementById("troco_para");

  botoesPagamento.forEach(botao => {
    botao.addEventListener("click", () => {
      botoesPagamento.forEach(b => b.classList.remove("active"));
      botao.classList.add("active");

      const valor = botao.dataset.value;
      inputForma.value = valor;

      campoTroco.style.display = valor === "Dinheiro" ? "block" : "none";
    });
  });

  // FORMATAÇÃO DO CAMPO TROCO COMO MOEDA
  if (trocoParaInput) {
    const formatarMoeda = (valor) => {
      let num = valor.replace(/\D/g, "");
      if (num === "") num = "0";
      num = (parseInt(num, 10) / 100).toFixed(2);
      return "R$ " + num.replace(".", ",");
    };

    trocoParaInput.addEventListener("input", () => {
      const pos = trocoParaInput.selectionStart;
      trocoParaInput.value = formatarMoeda(trocoParaInput.value);
      trocoParaInput.setSelectionRange(trocoParaInput.value.length, trocoParaInput.value.length);
    });

    trocoParaInput.addEventListener("focus", () => {
      if (trocoParaInput.value.trim() === "") {
        trocoParaInput.value = "R$ 0,00";
      }
    });

    trocoParaInput.addEventListener("blur", () => {
      if (trocoParaInput.value.trim() === "") {
        trocoParaInput.value = "R$ 0,00";
      }
    });

    trocoParaInput.value = "R$ 0,00";
  }
}


function pegarSelecionado(id) {
  const btn = document.querySelector(`#${id} .btn-option.active`);
  return btn ? btn.dataset.value : null;
}

function pegarSelecionados(id) {
  const btns = document.querySelectorAll(`#${id} .btn-option.active`);
  return [...btns].map(b => b.dataset.value);
}

function renderizarSacola() {
  sacolaDiv.innerHTML = "";
  sacola.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "bg-white p-4 rounded-md shadow border";

    const adicionaisHTML = item.adicionais.length
      ? `<p class="font-bold mt-2">Adicionais:</p><ul class="list-disc list-inside">` +
      item.adicionais.map(a => `<li>${a.quantidade}x ${a.nome}</li>`).join("") +
      `</ul>` : "";

    const bebidasHTML = item.bebidas.length
      ? `<p class="font-bold mt-2">Bebidas:</p><ul class="list-disc list-inside">` +
      item.bebidas.map(b => `<li>${b.quantidade}x ${b.nome}</li>`).join("") +
      `</ul>` : "";

    const outrosHTML = item.outros.length
      ? `<p class="font-bold mt-2">Outros:</p><ul class="list-disc list-inside">` +
      item.outros.map(o => `<li>${o.quantidade}x ${o.nome}</li>`).join("") +
      `</ul>` : "";

    div.innerHTML = `
      <p class="font-bold">Marmita ${index + 1}</p>
      <p><strong>Tamanho:</strong> ${item.tamanho}</p>
      <p><strong>Carne:</strong> ${item.carne}</p>
      ${adicionaisHTML}
      ${bebidasHTML}
      ${outrosHTML}
      <p class="mt-2"><strong>Observações:</strong> ${item.observacao || "Nenhuma"}</p>
      <button type="button" class="text-red-600 font-bold mt-2" onclick="removerMarmita(${index})">Remover</button>
    `;

    sacolaDiv.appendChild(div);
  });
}

function removerMarmita(index) {
  sacola.splice(index, 1);
  renderizarSacola();
}

function limparSelecoes() {
  document.querySelectorAll(".btn-option").forEach(b => b.classList.remove("active"));
  bebidasData.forEach(b => b.quantidade = 0);
  outrosData.forEach(o => o.quantidade = 0);
  adicionaisData.forEach(a => a.quantidade = 0);
  inserirQuantidades(adicionaisData, "adicionais");

  document.getElementById("observacoes").value = "";
  inserirQuantidades(bebidasData, "bebidas");
  inserirQuantidades(outrosData, "outros");
}

function inserirOpcoes(dados, id) {
  const container = document.getElementById(id);
  container.innerHTML = "";
  const selecaoUnica = (id === "carnes" || id === "tamanhos");

  if (Array.isArray(dados)) {
    dados.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-option";
      btn.innerText = item;
      btn.dataset.value = item;

      btn.addEventListener("click", () => {
        if (selecaoUnica) {
          document.querySelectorAll(`#${id} .btn-option`).forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        } else {
          btn.classList.toggle("active");
        }
      });

      container.appendChild(btn);
    });
  } else {
    Object.entries(dados).forEach(([nome, valor]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-option";
      btn.innerText = nome;
      btn.dataset.value = nome;

      btn.addEventListener("click", () => {
        btn.classList.toggle("active");
      });

      container.appendChild(btn);
    });
  }
}

function inserirQuantidades(lista, id) {
  const container = document.getElementById(id);
  container.innerHTML = "";

  lista.forEach(item => {
    const wrapper = document.createElement("div");
    wrapper.className = "btn-option flex items-center gap-2 border-black border-2 rounded-lg";


    const nome = document.createElement("span");
    nome.textContent = item.nome;

    const menos = document.createElement("button");
    menos.type = "button";
    menos.textContent = "−";
    menos.className = "border border-black rounded w-6 h-6 flex items-center justify-center text-sm font-medium";
    menos.addEventListener("click", () => {
      if (item.quantidade > 0) {
        item.quantidade--;
        quantidade.textContent = item.quantidade;
      }
    });

    const quantidade = document.createElement("span");
    quantidade.textContent = item.quantidade;
    quantidade.className = "w-4 text-center text-sm font-medium";

    const mais = document.createElement("button");
    mais.type = "button";
    mais.textContent = "+";
    mais.className = "border border-black rounded w-6 h-6 flex items-center justify-center text-sm font-medium";
    mais.addEventListener("click", () => {
      item.quantidade++;
      quantidade.textContent = item.quantidade;
    });

    wrapper.append(nome, menos, quantidade, mais);
    container.appendChild(wrapper);
  });
}

document.getElementById("formulario").addEventListener("submit", function (e) {
  e.preventDefault();

  if (sacola.length === 0) {
    alert("Adicione pelo menos uma marmita antes de finalizar o pedido.");
    return;
  }


  const nome = document.querySelector("input[name='nome']").value;
  const telefone = "";
  const endereco = "";
  const formaPagamento = document.getElementById("forma_pagamento").value;
  const trocoPara = document.getElementById("troco_para").value;

  const dados = {
    tipo_formulario: "marmita",
    tipo_pedido: "balcao",
    nome,
    telefone,
    endereco,
    forma_pagamento: formaPagamento,
    troco_para: formaPagamento === "Dinheiro" ? trocoPara : "",
    marmitas: sacola
  };

  fetch("/pedido", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados)
  })
    .then(res => res.json())
    .then(data => {
      if (data.redirect) {
        window.location.href = data.redirect;
      } else {
        alert("Erro ao redirecionar para o recibo.");
      }
    })
    .catch(err => {
      console.error("Erro ao enviar pedido:", err);
      alert("Erro de conexão.");
    });

});
