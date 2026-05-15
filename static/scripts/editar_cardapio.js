document.addEventListener("DOMContentLoaded", () => {
    carregarCardapio();
    configurarBotoes();
});

function formatarMoeda(input) {
    let valor = input.value.replace(/\D/g, "");
    valor = (parseInt(valor, 10) / 100).toFixed(2);
    input.value = "R$ " + valor.replace(".", ",");
}

async function carregarCardapio() {
    try {
        const res = await fetch("/cardapio");
        const data = await res.json();

        const { marmita, prato } = data;

        const marmitaComum = marmita.tipos?.comum || {};
        const marmitaExecutivo = marmita.tipos?.executivo || {};

        const pratoComum = prato.tipos?.comum || {};
        const pratoExecutivo = prato.tipos?.executivo || {};

        preencherTamanhos("tamanhos-cadastrados-comum", marmitaComum.tamanhos || {});
        preencherTamanhos("tamanhos-cadastrados-executivo", marmitaExecutivo.tamanhos || {});

        preencherCarnes("carnes-cadastradas-comum", marmitaComum.carnes || []);
        preencherCarnes("carnes-cadastradas-executivo", marmitaExecutivo.carnes || []);

        preencherTamanhos("tamanhos-cadastrados-prato-comum", pratoComum.tamanhos || {});
        preencherTamanhos("tamanhos-cadastrados-prato-executivo", pratoExecutivo.tamanhos || {});

        preencherCarnes("carnes-cadastradas-prato-comum", pratoComum.carnes || []);
        preencherCarnes("carnes-cadastradas-prato-executivo", pratoExecutivo.carnes || []);

        preencherAdicionais("adicionais-cadastrados-marmita", marmita.adicionais || []);
        preencherAdicionais("adicionais-cadastrados-prato", prato.adicionais || {});

        preencherAdicionais("bebidas-cadastradas", data.bebidas || {});
        preencherAdicionais("outros-cadastrados", data.outros || {});
    } catch (err) {
        console.error("Erro ao carregar cardápio:", err);
    }
}

function formatarValor(valor) {
    return "R$ " + parseFloat(valor).toFixed(2).replace(".", ",");
}

function parseValor(str) {
    return parseFloat(str.replace("R$", "").replace(",", ".").trim());
}

function preencherAdicionais(id, adicionais) {
    const ul = document.getElementById(id);
    ul.innerHTML = "";

    // Se for array (marmita), usamos forEach direto
    if (Array.isArray(adicionais)) {
        adicionais.forEach(({ nome, preco }) => {
            const li = document.createElement("li");
            li.className = "flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md";
            li.innerHTML = `
        <span class="w-1/2">${nome}</span>
        <input type="text" class="input-edit w-24" value="${formatarValor(preco)}" oninput="formatarMoeda(this)" />
        <button class='text-red-500 font-bold' onclick='this.parentElement.remove()'>X</button>
      `;
            ul.appendChild(li);
        });
    } else {
        // Se for objeto (prato, bebidas, outros)
        Object.entries(adicionais).forEach(([nome, preco]) => {
            const li = document.createElement("li");
            li.className = "flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md";
            li.innerHTML = `
        <span class="w-1/2">${nome}</span>
        <input type="text" class="input-edit w-24" value="${formatarValor(preco)}" oninput="formatarMoeda(this)" />
        <button class='text-red-500 font-bold' onclick='this.parentElement.remove()'>X</button>
      `;
            ul.appendChild(li);
        });
    }
}


function preencherCarnes(id, carnes) {
    const ul = document.getElementById(id);
    ul.innerHTML = "";
    carnes.forEach(carne => {
        const li = document.createElement("li");
        li.className = "flex items-center justify-between bg-gray-100 px-3 py-1 rounded-md";
        li.innerHTML = `
      <span class="w-1/2">${carne}</span>
      <button class='text-red-500 font-bold' onclick='this.parentElement.remove()'>X</button>
      <input type="hidden" name="${id === 'carnes-cadastradas-marmita' ? 'carnes_marmita[]' : 'carnes_prato[]'}" value="${carne}">
    `;
        ul.appendChild(li);
    });
}
function preencherTamanhos(id, tamanhos) {
    const ul = document.getElementById(id);
    ul.innerHTML = "";

    Object.entries(tamanhos || {}).forEach(([nome, preco]) => {
        const li = document.createElement("li");
        li.className = "flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md";

        li.innerHTML = `
            <span class="w-1/2">${nome}</span>
            <input type="text" class="input-edit w-24" value="${formatarValor(preco)}" oninput="formatarMoeda(this)" />
            <button class="text-red-500 font-bold" onclick="this.parentElement.remove()">X</button>
        `;

        ul.appendChild(li);
    });
}


function configurarBotoes() {
    configurarAdicional("add-adicional-marmita", "novo-adicional-marmita", "preco-adicional-marmita", "adicionais-cadastrados-marmita");
    configurarAdicional("add-adicional-prato", "novo-adicional-prato", "preco-adicional-prato", "adicionais-cadastrados-prato");

    configurarAdicional("add-adicional-bebida", "novo-adicional-bebida", "preco-adicional-bebida", "bebidas-cadastradas");
    configurarAdicional("add-adicional-outro", "novo-adicional-outro", "preco-adicional-outro", "outros-cadastrados");
    configurarTamanho("add-tamanho-comum", "novo-tamanho-comum", "preco-tamanho-comum", "tamanhos-cadastrados-comum");
    configurarTamanho("add-tamanho-executivo", "novo-tamanho-executivo", "preco-tamanho-executivo", "tamanhos-cadastrados-executivo");

    configurarTamanho("add-tamanho-prato-comum", "novo-tamanho-prato-comum", "preco-tamanho-prato-comum", "tamanhos-cadastrados-prato-comum");
    configurarTamanho("add-tamanho-prato-executivo", "novo-tamanho-prato-executivo", "preco-tamanho-prato-executivo", "tamanhos-cadastrados-prato-executivo");
    
    configurarCarne("add-carne-comum", "input-carne-comum", "carnes-cadastradas-comum");
    configurarCarne("add-carne-executivo", "input-carne-executivo", "carnes-cadastradas-executivo");

    configurarCarne("add-carne-prato-comum", "input-carne-prato-comum", "carnes-cadastradas-prato-comum");
    configurarCarne("add-carne-prato-executivo", "input-carne-prato-executivo", "carnes-cadastradas-prato-executivo");



}

function configurarAdicional(btnId, nomeId, precoId, listaId) {
    const botao = document.getElementById(btnId);
    const inputNome = document.getElementById(nomeId);
    const inputPreco = document.getElementById(precoId);
    const lista = document.getElementById(listaId);

    botao.addEventListener("click", () => {
        const nome = inputNome.value.trim();
        const preco = parseValor(inputPreco.value || "0");
        if (!nome) return;

        const li = document.createElement("li");
        li.className = "flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md";
        li.innerHTML = `
      <span class="w-1/2">${nome}</span>
      <input type="text" class="input-edit w-24" value="${formatarValor(preco)}" oninput="formatarMoeda(this)" />
      <button class='text-red-500 font-bold' onclick='this.parentElement.remove()'>X</button>
    `;
        lista.appendChild(li);
        inputNome.value = "";
        inputPreco.value = "";
    });
}

function configurarCarne(btnId, inputId, containerId) {
    const botao = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    const container = document.getElementById(containerId);

    botao.addEventListener("click", () => {
        const nome = input.value.trim();
        if (!nome) return;

        const li = document.createElement("li");
        li.className = "flex items-center justify-between bg-gray-100 px-3 py-1 rounded-md mb-2";
        li.innerHTML = `
        <span class="w-1/2">${nome}</span>
        <button class='text-red-500 font-bold' onclick='this.parentElement.remove()'>X</button>
        <input type="hidden" name="${containerId === 'carnes-cadastradas-marmita' ? 'carnes_marmita[]' : 'carnes_prato[]'}" value="${nome}">
        `;
        container.appendChild(li);

        input.value = "";
    });
}
function configurarTamanho(btnId, nomeId, precoId, listaId) {
    const botao = document.getElementById(btnId);
    const inputNome = document.getElementById(nomeId);
    const inputPreco = document.getElementById(precoId);
    const lista = document.getElementById(listaId);

    botao.addEventListener("click", () => {
        const nome = inputNome.value.trim();
        const preco = parseValor(inputPreco.value || "0");

        if (!nome) return;

        const li = document.createElement("li");
        li.className = "flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-md";

        li.innerHTML = `
            <span class="w-1/2">${nome}</span>
            <input type="text" class="input-edit w-24" value="${formatarValor(preco)}" oninput="formatarMoeda(this)" />
            <button class="text-red-500 font-bold" onclick="this.parentElement.remove()">X</button>
        `;

        lista.appendChild(li);

        inputNome.value = "";
        inputPreco.value = "";
    });
}

function salvarCardapio() {
    const getAdicionais = (id, comoArray = false) => {
        const ul = document.getElementById(id);

        if (comoArray) {
            const lista = [];
            ul.querySelectorAll("li").forEach(li => {
                const nome = li.querySelector("span").innerText;
                const preco = parseValor(li.querySelector("input").value);
                lista.push({ nome, preco });
            });
            return lista;
        }

        const itens = {};
        ul.querySelectorAll("li").forEach(li => {
            const nome = li.querySelector("span").innerText;
            const preco = parseValor(li.querySelector("input").value);
            itens[nome] = preco;
        });
        return itens;
    };

    const getCarnes = (id) => {
        const ul = document.getElementById(id);
        const carnes = [];

        ul.querySelectorAll("input[type='hidden']").forEach(input => {
            carnes.push(input.value);
        });

        return carnes;
    };

    const getTamanhos = (id) => {
        const ul = document.getElementById(id);
        const tamanhos = {};

        ul.querySelectorAll("li").forEach(li => {
            const nome = li.querySelector("span").innerText;
            const preco = parseValor(li.querySelector("input").value);
            tamanhos[nome] = preco;
        });

        return tamanhos;
    };

    const dados = {
        marmita: {
            tipos: {
                comum: {
                    tamanhos: getTamanhos("tamanhos-cadastrados-comum"),
                    carnes: getCarnes("carnes-cadastradas-comum")
                },
                executivo: {
                    tamanhos: getTamanhos("tamanhos-cadastrados-executivo"),
                    carnes: getCarnes("carnes-cadastradas-executivo")
                }
            },
            adicionais: getAdicionais("adicionais-cadastrados-marmita", true)
        },

        prato: {
            tipos: {
                comum: {
                    tamanhos: getTamanhos("tamanhos-cadastrados-prato-comum"),
                    carnes: getCarnes("carnes-cadastradas-prato-comum")
                },
                executivo: {
                    tamanhos: getTamanhos("tamanhos-cadastrados-prato-executivo"),
                    carnes: getCarnes("carnes-cadastradas-prato-executivo")
                }
            },
            adicionais: getAdicionais("adicionais-cadastrados-prato")
        },

        bebidas: getAdicionais("bebidas-cadastradas"),
        outros: getAdicionais("outros-cadastrados")
    };

    fetch("/salvar_cardapio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados)
    })
        .then(res => res.json())
        .then(res => mostrarMensagem("Cardápio atualizado com sucesso!", "green"))
        .catch(err => mostrarMensagem("Erro ao salvar cardápio.", "red"));
}

function mostrarMensagem(msg, cor = 'green') {
    let toast = document.getElementById("mensagem-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "mensagem-toast";
        toast.className = `fixed bottom-4 right-4 bg-${cor}-600 text-white px-4 py-2 rounded shadow-lg z-50`;
        document.body.appendChild(toast);
    }

    toast.textContent = msg;
    toast.className = `fixed bottom-4 right-4 bg-${cor}-600 text-white px-4 py-2 rounded shadow-lg z-50`;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}

