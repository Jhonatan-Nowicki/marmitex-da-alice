document.addEventListener('DOMContentLoaded', () => {
  const btnAdd = document.getElementById('add-prato');
  const sacola = document.getElementById('sacola');
  let pratos = [];
  let index = 0;
  let tiposPrato = {};
  let tipoSelecionado = null;
  let baseSelecionadaAutomatica = null;

  const adicionaisSelecionados = {};
  const bebidasSelecionados = {};
  const outrosSelecionados = {};

  carregarCardapio();
  configurarPagamento();

  async function carregarCardapio() {
    try {
      const res = await fetch("/cardapio");
      const data = await res.json();

      tiposPrato = data.prato.tipos || {};

      const adicionais = data.prato.adicionais || {};
      const bebidas = data.bebidas || {};
      const outros = data.outros || {};

      preencherTiposPrato();

      preencherComQuantidade("adicionais", adicionais, adicionaisSelecionados);
      // Transforma bebidas: { nome: { preco, quantidade } } → { nome: preco }
      const bebidasFormatadas = {};
      bebidas.forEach(item => bebidasFormatadas[item.nome] = item.preco);

      const outrosFormatados = {};
      outros.forEach(item => outrosFormatados[item.nome] = item.preco);



      preencherComQuantidade("bebidas", bebidasFormatadas, bebidasSelecionados);
      preencherComQuantidade("outros", outrosFormatados, outrosSelecionados);

    } catch (err) {
      console.error("Erro ao carregar cardápio:", err);
    }
  }

  function preencherTiposPrato() {
    const container = document.getElementById("tipos-prato");
    container.innerHTML = "";

    Object.keys(tiposPrato).forEach(tipo => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-option";
      btn.dataset.value = tipo;
      btn.textContent = tipo === "comum" ? "Prato Feito" : "Prato Feito Executivo";

      btn.addEventListener("click", () => {
        container.querySelectorAll(".btn-option").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        tipoSelecionado = tipo;

        const dadosTipo = tiposPrato[tipo];
        const tamanhos = Object.keys(dadosTipo.tamanhos || {});

        baseSelecionadaAutomatica = tamanhos[0] || null;

        document.getElementById("bloco-carne-prato").classList.remove("hidden");
        preencherBotoes("carne", dadosTipo.carnes || [], true);
      });

      container.appendChild(btn);
    });
  }

  function preencherBotoes(id, lista, exclusivo = false) {
    const container = document.getElementById(id);
    container.innerHTML = "";
    lista.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-option";
      btn.dataset.value = item;
      btn.textContent = item;
      btn.addEventListener("click", () => {
        if (exclusivo) {
          container.querySelectorAll(".btn-option").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
        }
      });
      container.appendChild(btn);
    });
  }

  function preencherComQuantidade(id, dados, destino) {
    const container = document.getElementById(id);
    container.innerHTML = "";

    Object.keys(dados).forEach(item => {
      destino[item] = 0;

      const wrapper = document.createElement("div");
      wrapper.className = "quantidade-wrapper";

      const nome = document.createElement("span");
      nome.textContent = item;

      const btnMenos = document.createElement("button");
      btnMenos.type = "button";
      btnMenos.className = "quantidade-btn";
      btnMenos.textContent = "−";
      btnMenos.addEventListener("click", () => {
        if (destino[item] > 0) {
          destino[item]--;
          qtd.textContent = destino[item];
        }
      });

      const qtd = document.createElement("span");
      qtd.className = "quantidade-display";
      qtd.textContent = "0";

      const btnMais = document.createElement("button");
      btnMais.type = "button";
      btnMais.className = "quantidade-btn";
      btnMais.textContent = "+";
      btnMais.addEventListener("click", () => {
        destino[item]++;
        qtd.textContent = destino[item];
      });

      wrapper.appendChild(nome);
      wrapper.appendChild(btnMenos);
      wrapper.appendChild(qtd);
      wrapper.appendChild(btnMais);

      container.appendChild(wrapper);
    });
  }

  function getSelecionadosQuantidades(obj) {
    return Object.entries(obj).filter(([_, qtd]) => qtd > 0).map(([nome, qtd]) => ({ nome, quantidade: qtd }));
  }

  function criarItem(prato, idx) {
    const div = document.createElement('div');
    div.className = "bg-white/80 rounded-lg p-4 shadow relative";

    let html = `
    <button type="button" class="absolute top-2 right-2 text-red-600 font-bold text-lg" title="Remover item">&times;</button>
    <p><strong>Tipo:</strong> ${prato.tipo}</p>
    <p><strong>Carne:</strong> ${prato.carne}</p>
  `;

    const categorias = ["adicionais", "bebidas", "outros"];
    categorias.forEach(cat => {
      if (prato[cat].length > 0) {
        html += `<p><strong>${cat.charAt(0).toUpperCase() + cat.slice(1)}:</strong></p><ul class="list-disc ml-5">`;
        prato[cat].forEach(el => {
          html += `<li>${el.quantidade}x ${el.nome}</li>`;
        });
        html += "</ul>";
      }
    });

    html += `
    <p><strong>Observações:</strong> ${prato.observacao || "Nenhuma"}</p>

    <input type="hidden" name="pratos[${idx}][tipo]" value="${prato.tipo}">
    <input type="hidden" name="pratos[${idx}][base]" value="${prato.base}">
    <input type="hidden" name="pratos[${idx}][carne]" value="${prato.carne}">
    <input type="hidden" name="pratos[${idx}][observacao]" value="${prato.observacao}">
  `;

    categorias.forEach(cat => {
      prato[cat].forEach((el, i) => {
        html += `
        <input type="hidden" name="pratos[${idx}][${cat}][${i}][nome]" value="${el.nome}">
        <input type="hidden" name="pratos[${idx}][${cat}][${i}][quantidade]" value="${el.quantidade}">
      `;
      });
    });

    div.innerHTML = html;

    div.querySelector('button').addEventListener('click', () => {
      pratos.splice(idx, 1);
      renderSacola();
    });

    return div;
  }


  function renderSacola() {
    sacola.innerHTML = "";
    pratos.forEach((prato, idx) => {
      const item = criarItem(prato, idx);
      sacola.appendChild(item);
    });
  }

  btnAdd.addEventListener('click', () => {
    const baseSelecionada = document.querySelector("#carne .btn-option.active");
    if (!tipoSelecionado || !baseSelecionadaAutomatica) {
      alert("Selecione o tipo do prato.");
      return;
    }

    if (!baseSelecionada) {
      alert("Por favor, selecione a carne do prato.");
      return;
    }

    const prato = {
      tipo: tipoSelecionado,
      base: baseSelecionadaAutomatica,
      carne: baseSelecionada.dataset.value,
      adicionais: getSelecionadosQuantidades(adicionaisSelecionados),
      bebidas: getSelecionadosQuantidades(bebidasSelecionados),
      outros: getSelecionadosQuantidades(outrosSelecionados),
      observacao: document.getElementById("observacoes").value.trim()
    };

    pratos.push(prato);
    index++;
    renderSacola();

    // Reset
    document.querySelectorAll(".btn-option").forEach(btn => btn.classList.remove("active"));
    Object.keys(adicionaisSelecionados).forEach(k => adicionaisSelecionados[k] = 0);
    Object.keys(bebidasSelecionados).forEach(k => bebidasSelecionados[k] = 0);
    Object.keys(outrosSelecionados).forEach(k => outrosSelecionados[k] = 0);
    document.getElementById("observacoes").value = "";

    carregarCardapio(); // Atualiza visual
  });

  function configurarPagamento() {
    const botoesPagamento = document.querySelectorAll("#pagamento-opcoes .btn-option");
    const inputForma = document.getElementById("forma_pagamento");
    const campoTroco = document.getElementById("campo-troco");

    botoesPagamento.forEach(botao => {
      botao.addEventListener("click", () => {
        botoesPagamento.forEach(b => b.classList.remove("active"));
        botao.classList.add("active");

        const valor = botao.dataset.value;
        inputForma.value = valor;
        campoTroco.style.display = valor === "Dinheiro" ? "block" : "none";
      });
    });
  }

  const btnEnviar = document.getElementById("btn-enviar-pedido");

  btnEnviar.addEventListener("click", async () => {
    if (pratos.length === 0) {
      alert("Adicione pelo menos 1 prato antes de enviar.");
      return;
    }

    const dadosPedido = {
      tipo_formulario: "prato",
      tipo_pedido: "Retirada",  // ou "Entrega" se quiser implementar
      nome: document.getElementById("nome").value.trim(),
      telefone: "",  // opcional
      endereco: "",  // opcional
      pratos: pratos,
      forma_pagamento: document.getElementById("forma_pagamento").value,
      troco_para: document.getElementById("troco_para").value
    };

    try {
      const response = await fetch("/pedido", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(dadosPedido)
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro);
      }

      const resultado = await response.json();
      window.location.href = resultado.redirect;
    } catch (err) {
      console.error("Erro ao enviar pedido:", err);
      alert("Erro ao enviar pedido. Verifique os dados e tente novamente.");
    }
  });

});

document.addEventListener("DOMContentLoaded", () => {
  const trocoInput = document.getElementById("troco_para");

  if (trocoInput) {
    trocoInput.addEventListener("input", function () {
      let valor = trocoInput.value.replace(/\D/g, "");
      valor = (parseInt(valor || 0) / 100).toFixed(2);
      trocoInput.value = "R$ " + valor.replace(".", ",");
    });
  }
});
