from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, jsonify

from datetime import datetime
from zoneinfo import ZoneInfo
import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

app = Flask(__name__)
app.secret_key = 'chave_super_secreta'

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")



supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def agora_brasilia():
    return datetime.now(ZoneInfo("America/Sao_Paulo"))


def carregar_precos():
    resposta = supabase.table("cardapio").select("dados").eq("id", "principal").execute()

    if resposta.data:
        return resposta.data[0]["dados"]

    return {}

    
def salvar_precos(novos_precos):
    supabase.table("cardapio").update({
        "dados": novos_precos,
        "atualizado_em": agora_brasilia().isoformat()
    }).eq("id", "principal").execute()

PRECOS = carregar_precos() 

@app.route('/')
def index():
    return redirect(url_for('login'))

@app.route("/ping")
def ping():
    return "OK", 200



@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        usuario = request.form['usuario']
        senha = request.form['senha']

        if usuario == os.getenv("USUARIO_DONO") and senha == os.getenv("SENHA_DONO"):
            session['usuario'] = 'dono'
            return redirect(url_for('escolha_tipo'))
        
        elif usuario == os.getenv("USUARIO_FUNC") and senha == os.getenv("SENHA_FUNC"):
            session['usuario'] = 'funcionario'
            return redirect(url_for('escolha_tipo'))
        
        else:
            return render_template("login.html", erro="Usuario ou senha Inválido")
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login'))

@app.route('/editar_cardapio', methods=['GET', 'POST'])
def editar_cardapio():
    if 'usuario' not in session or session['usuario'] != 'dono':
        return redirect(url_for('login'))

    precos = carregar_precos()

    if request.method == 'POST':
        # Marmita - Tamanhos
        tamanhos = {}
        for key, value in request.form.items():
            if key.startswith("marmita_tamanho_nome_"):
                idx = key.split("_")[-1]
                nome = value.strip()
                preco = float(request.form.get(f"marmita_tamanho_preco_{idx}", 0))
                if nome:
                    tamanhos[nome] = preco
        precos["marmita"]["tamanhos"] = tamanhos

        # Marmita - Adicionais
        marmita_adicionais = {}
        for key, value in request.form.items():
            if key.startswith("marmita_adicional_nome_"):
                idx = key.split("_")[-1]
                nome = value.strip()
                preco = float(request.form.get(f"marmita_adicional_preco_{idx}", 0))
                if nome:
                    marmita_adicionais[nome] = preco
        precos["marmita"]["adicionais"] = marmita_adicionais

        # Marmita - Carnes
        carnes_marmita = request.form.getlist("carnes_marmita[]")
        precos["marmita"]["carnes"] = carnes_marmita

        # Prato Feito - Base
        base_prato = float(request.form.get("prato_feito", 0))
        precos["prato"]["base"] = base_prato

        # Prato Feito - Adicionais
        prato_adicionais = {}
        for key, value in request.form.items():
            if key.startswith("prato_adicional_nome_"):
                idx = key.split("_")[-1]
                nome = value.strip()
                preco = float(request.form.get(f"prato_adicinal_preco_{idx}", 0))
                if nome:
                    prato_adicionais[nome] = preco
        precos["prato"]["adicionais"] = prato_adicionais

        # Prato Feito - Carnes
        carnes_prato = request.form.getlist("carnes_prato[]")
        precos["prato"]["carnes"] = carnes_prato

        # Salvar alterações
        salvar_precos(precos)
        global PRECOS
        PRECOS = precos
        return redirect(url_for("escolha_tipo"))

    return render_template("editar_cardapio.html", precos=precos)


@app.route('/escolha')
def escolha_tipo():
    if 'usuario' not in session:
        return redirect(url_for('login'))
    return render_template('escolha.html')


@app.route('/pedido/marmita')
def formulario_marmita():
    if 'usuario' not in session:
        return redirect(url_for('login'))
    return render_template('form_marmita.html')

@app.route('/pedido/prato-feito')
def formulario_prato_feito():
    if 'usuario' not in session:
        return redirect(url_for('login'))
    return render_template('form_prato.html')

def gerar_numero_pedido():
    hoje = agora_brasilia().strftime('%Y-%m-%d')

    resposta = supabase.table("contador_pedidos").select("*").eq("data", hoje).execute()

    if resposta.data:
        numero = resposta.data[0]["numero"] + 1

        supabase.table("contador_pedidos").update({
            "numero": numero
        }).eq("data", hoje).execute()

    else:
        numero = 1

        supabase.table("contador_pedidos").insert({
            "data": hoje,
            "numero": numero
        }).execute()

    return numero

@app.route("/pedido", methods=["POST"])
def pedido():
    if 'usuario' not in session:
        return redirect(url_for('login'))

    if not request.is_json:
        return "Requisição inválida", 400

    data = request.get_json()

    tipo_formulario = data.get("tipo_formulario")
    pedido_id = gerar_numero_pedido()
    forma_pagamento = data.get("forma_pagamento", "")
    troco_para = data.get("troco_para", "")

    dados = {
        "pedido_id": pedido_id,
        "tipo_pedido": data.get("tipo_pedido"),
        "nome": data.get("nome"),
        "telefone": data.get("telefone"),
        "endereco": data.get("endereco"),
        "data_hora": agora_brasilia().strftime("%d/%m/%Y %H:%M"),
        "valor_total": 0.0,
        "forma_pagamento": forma_pagamento,
        "troco_para": troco_para
    }

    total = 0.0

    if tipo_formulario == "marmita":
        marmitas = data.get("marmitas", [])
        for marmita in marmitas:
            preco_total_marmita = 0

            # Tamanho da marmita
            tamanho = marmita.get("tamanho")
            preco_tamanho = PRECOS["marmita"]["tamanhos"].get(tamanho, 0)
            preco_total_marmita += preco_tamanho

            # Adicionais
            adicionais_processados = []
            for adicional in marmita.get("adicionais", []):
                nome = adicional["nome"]
                qtd = adicional.get("quantidade", 0)
                preco_unit = next((a["preco"] for a in PRECOS["marmita"]["adicionais"] if a["nome"] == nome), 0)
                preco_total_marmita += preco_unit * qtd
                adicionais_processados.append({"nome": nome, "quantidade": qtd})

            # Bebidas
            bebidas_processadas = []
            for bebida in marmita.get("bebidas", []):
                nome = bebida["nome"]
                qtd = bebida.get("quantidade", 0)
                preco_unit = PRECOS["bebidas"].get(nome, 0)
                preco_total_marmita += preco_unit * qtd
                bebidas_processadas.append({
                    "nome": nome,
                    "quantidade": qtd,
                    "preco": preco_unit
                })

            # Outros
            outros_processados = []
            for outro in marmita.get("outros", []):
                nome = outro["nome"]
                qtd = outro.get("quantidade", 0)
                preco_unit = PRECOS["outros"].get(nome, 0)
                preco_total_marmita += preco_unit * qtd
                outros_processados.append({
                    "nome": nome,
                    "quantidade": qtd,
                    "preco": preco_unit
                })


            # Atualiza estrutura da marmita
            marmita["adicionais"] = adicionais_processados
            marmita["bebidas"] = bebidas_processadas
            marmita["outros"] = outros_processados
            marmita["preco"] = round(preco_total_marmita, 2)
            marmita["observacao"] = marmita.get("observacao", "")

            total += preco_total_marmita

        dados["marmitas"] = marmitas
        dados["valor_total"] = round(total, 2)
       
        

        # Troco
        if forma_pagamento == "Dinheiro" and troco_para:
            try:
                troco_para_float = float(str(troco_para).replace("R$", "").replace(".", "").replace(",", ".").strip())
                troco = round(troco_para_float - total, 2)
                if troco < 0:
                    troco = 0
            except ValueError:
                troco = 0
        else:
            troco = 0
        dados["troco"] = troco
        
        supabase.table("pedidos").insert({
            "numero_pedido": pedido_id,
            "nome": dados.get("nome"),
            "telefone": dados.get("telefone"),
            "endereco": None,
            "tipo_pedido": "balcao",
            "forma_pagamento": forma_pagamento,
            "total": dados.get("valor_total"),
            "valor_total": dados.get("valor_total"),
            "tipo_formulario": tipo_formulario,
            "troco": dados.get("troco"),
            "troco_para": troco_para,
            "dados": dados
        }).execute()

        

        return jsonify({"redirect": url_for("recibo_marmita", pedido_id=pedido_id)})


    elif tipo_formulario == "prato":
        pratos = data.get("pratos", [])
        total = 0.0
        pratos_processados = []

        for prato in pratos:
            base = prato.get("base")
            adicionais = prato.get("adicionais", [])
            bebidas = prato.get("bebidas", [])
            outros = prato.get("outros", [])
            observacao = prato.get("observacao", "")


            preco_total = 0.0

            # base do prato (valor fixo)
            preco_total += PRECOS["prato"]["base"]

            # adicionais
            for adicional in adicionais:
                nome = adicional["nome"]
                qtd = adicional["quantidade"]
                preco_unit = PRECOS["prato"]["adicionais"].get(nome, 0)
                preco_total += preco_unit * qtd
                adicional["preco"] = preco_unit

            # bebidas
            for bebida in bebidas:
                nome = bebida["nome"]
                qtd = bebida["quantidade"]
                preco_unit = PRECOS["bebidas"].get(nome, 0)
                preco_total += preco_unit * qtd
                bebida["preco"] = preco_unit

            # outros
            for outro in outros:
                nome = outro["nome"]
                qtd = outro["quantidade"]
                preco_unit = PRECOS["outros"].get(nome, 0)
                preco_total += preco_unit * qtd
                outro["preco"] = preco_unit

            pratos_processados.append({
                "base": base,
                "adicionais": adicionais,
                "bebidas": bebidas,
                "outros": outros,
                "observacao": observacao,
                "preco": round(preco_total, 2)
            })

            total += preco_total

    dados["pratos"] = pratos_processados
    dados["valor_total"] = round(total, 2)

    # Troco
    if forma_pagamento == "Dinheiro" and troco_para:
        try:
            troco_para_float = float(str(troco_para).replace("R$", "").replace(".", "").replace(",", ".").strip())
            troco = round(troco_para_float - total, 2)
            if troco < 0:
                troco = 0
        except ValueError:
            troco = 0
    else:
        troco = 0
    dados["troco"] = troco
    supabase.table("pedidos").insert({
        "numero_pedido": pedido_id,
        "nome": dados.get("nome"),
        "telefone": dados.get("telefone"),
        "endereco": None,
        "tipo_pedido": "balcao",
        "forma_pagamento": forma_pagamento,
        "total": dados.get("valor_total"),
        "valor_total": dados.get("valor_total"),
        "tipo_formulario": tipo_formulario,
        "troco": dados.get("troco"),
        "troco_para": troco_para,
        "dados": dados
    }).execute()

    return jsonify({"redirect": url_for("recibo_prato", pedido_id=pedido_id)})

def calcular_preco_marmita(marmita):
    valor = 0.0

    # Soma tamanho da marmita
    tamanho = marmita.get('tamanho', '')
    valor += PRECOS['marmita']['tamanhos'].get(tamanho, 0)

    # Adicionais (lista de objetos com nome e quantidade)
    for adicional in marmita.get('adicionais', []):
        nome = adicional.get("nome", "")
        quantidade = adicional.get("quantidade", 0)
        for item in PRECOS['marmita']['adicionais']:
            if item["nome"] == nome:
                valor += item["preco"] * quantidade
                break

    # Bebidas
    for bebida in marmita.get('bebidas', []):
        nome = bebida.get("nome", "")
        quantidade = bebida.get("quantidade", 0)
        for item in PRECOS["bebidas"]:
            if item["nome"] == nome:
                valor += item["preco"] * quantidade
                break

    # Outros
    for outro in marmita.get('outros', []):
        nome = outro.get("nome", "")
        quantidade = outro.get("quantidade", 0)
        for item in PRECOS["outros"]:
            if item["nome"] == nome:
                valor += item["preco"] * quantidade
                break

    return round(valor, 2)



def calcular_valor_total_multiplo(marmitas):
    total = 0.0
    for marmita in marmitas:
        tamanho = marmita.get('tamanho', '')
        valor = PRECOS['marmita']['tamanhos'].get(tamanho, 0)

        # Soma os adicionais com quantidade
        adicionais = marmita.get('adicionais', [])
        for adicional in adicionais:
            nome = adicional.get("nome", "")
            quantidade = adicional.get("quantidade", 1)
            preco_unitario = adicional.get("preco", 0)
            valor += quantidade * preco_unitario

        # Soma bebidas
        bebidas = marmita.get('bebidas', [])
        for bebida in bebidas:
            valor += bebida.get("quantidade", 0) * bebida.get("preco", 0)

        # Soma outros
        outros = marmita.get('outros', [])
        for outro in outros:
            valor += outro.get("quantidade", 0) * outro.get("preco", 0)

        total += valor
    return round(total, 2)


def calcular_valor_total(prato):
    adicionais_str = prato.get('adicionais', '')
    adicionais = [a.strip() for a in adicionais_str.split(',') if a.strip()]

    valor = PRECOS['prato']['base']
    for adicional in adicionais:
        valor += PRECOS['prato']['adicionais'].get(adicional, 0)
    return round(valor, 2)

@app.route('/cardapio')
def get_cardapio():
    def converter_para_lista(dicionario):
        return [
            {"nome": nome, "preco": preco, "quantidade": 0}
            for nome, preco in dicionario.items()
        ]

    bebidas_formatadas = converter_para_lista(PRECOS.get("bebidas", {}))
    outros_formatados = converter_para_lista(PRECOS.get("outros", {}))

    adicionais_formatados = [
        {**item, "quantidade": 0}
        for item in PRECOS['marmita']['adicionais']
    ]

    return jsonify({
        "marmita": {
            "tamanhos": PRECOS['marmita']['tamanhos'],
            "carnes": PRECOS['marmita'].get("carnes", []),
            "adicionais": adicionais_formatados
        },
        "prato": {
            "base": PRECOS['prato']['base'],
            "carnes": PRECOS['prato'].get("carnes", []),
            "adicionais": PRECOS['prato']['adicionais']
        },
        "bebidas": bebidas_formatadas,
        "outros": outros_formatados
    })


@app.route('/salvar_cardapio', methods=['POST'])
def salvar_cardapio():
    data = request.get_json()

    # Atualiza os valores de marmita
    PRECOS['marmita']['tamanhos'] = data['marmita']['tamanhos']
    PRECOS['marmita']['adicionais'] = data['marmita']['adicionais']
    PRECOS['marmita']['carnes'] = data['marmita'].get('carnes', [])

    # Atualiza os valores de prato
    PRECOS['prato']['base'] = data['prato']['base']
    PRECOS['prato']['adicionais'] = data['prato']['adicionais']
    PRECOS['prato']['carnes'] = data['prato'].get('carnes', [])

    # atualiza os valores de bebidas e outros
    PRECOS['bebidas'] = data.get('bebidas', {})
    PRECOS['outros'] = data.get('outros', {})

    salvar_precos(PRECOS)
    return jsonify({"status": "sucesso"})

@app.route("/recibo_marmita/<int:pedido_id>")
def recibo_marmita(pedido_id):
    resposta = supabase.table("pedidos").select("dados").eq("numero_pedido", pedido_id).order("id", desc=True).limit(1).execute()

    if not resposta.data:
        return "Pedido não encontrado", 404

    dados = resposta.data[0]["dados"]
    # Conversão segura
    # Dentro de recibo_marmita
    if dados.get("forma_pagamento") == "Dinheiro" and dados.get("troco_para"):
        try:
            troco_para = float(str(dados["troco_para"]).replace("R$", "").replace(".", "").replace(",", ".").strip())
        except ValueError:
            troco_para = 0.0
    else:
        troco_para = 0.0

    troco = float(dados.get("troco", 0.0))

    # Remove duplicados antes de expandir
    dados.pop("troco_para", None)
    dados.pop("troco", None)

    return render_template("recibo_marmita.html",
        **dados,
        PRECOS=PRECOS,
        troco_para=troco_para,
        troco=troco
    )



@app.route("/recibo_prato/<int:pedido_id>")
def recibo_prato(pedido_id):
    resposta = supabase.table("pedidos").select("dados").eq("numero_pedido", pedido_id).order("id", desc=True).limit(1).execute()

    if not resposta.data:
        return "Pedido não encontrado", 404

    dados = resposta.data[0]["dados"]

    # Calcular troco se necessário
    if dados.get("forma_pagamento") == "Dinheiro" and dados.get("troco_para"):
        try:
            troco_para = float(str(dados["troco_para"]).replace("R$", "").replace(".", "").replace(",", ".").strip())
        except ValueError:
            troco_para = 0.0
    else:
        troco_para = 0.0

    troco = float(dados.get("troco", 0.0))

    dados.pop("troco_para", None)
    dados.pop("troco", None)

    return render_template("recibo_prato.html",
        **dados,
        PRECOS=PRECOS,
        troco_para=troco_para,
        troco=troco
    )


@app.route("/recibo_rawbt.txt/<int:pedido_id>")
def recibo_rawbt(pedido_id):
    resposta = supabase.table("pedidos").select("dados").eq("numero_pedido", pedido_id).order("id", desc=True).limit(1).execute()

    if not resposta.data:
        return "Erro: pedido não encontrado", 404

    pedido = resposta.data[0]["dados"]

    conteudo = f"""
Marmitex da Alice
Cliente: {pedido['nome']}
Telefone: {pedido.get('telefone', '')}
Endereço: {pedido.get('endereco', '')}
Pedido Nº: {pedido['pedido_id']}
Data: {pedido['data_hora'].split(" ")[0]} Hora: {pedido['data_hora'].split(" ")[1]}
"""

    # MARMITA
    if "marmitas" in pedido:
        for marmita in pedido['marmitas']:
            conteudo += f"\n1x Marmita ({marmita['tamanho']})"
            if marmita.get("carne"):
                conteudo += f"\nCarne: {marmita['carne']}"

            for adicional in marmita.get('adicionais', []):
                if adicional['quantidade'] > 0:
                    conteudo += f"\n{adicional['quantidade']}x Adicional {adicional['nome']}"

            for bebida in marmita.get('bebidas', []):
                if bebida['quantidade'] > 0:
                    conteudo += f"\n{bebida['quantidade']}x {bebida['nome']}"

            for outro in marmita.get('outros', []):
                if outro['quantidade'] > 0:
                    conteudo += f"\n{outro['quantidade']}x {outro['nome']}"

    # PRATO
    if "pratos" in pedido:
        for prato in pedido['pratos']:
            conteudo += f"\n1x Prato Feito"
            for adicional in prato.get('adicionais', []):
                if adicional['quantidade'] > 0:
                    conteudo += f"\n{adicional['quantidade']}x {adicional['nome']}"
            for bebida in prato.get('bebidas', []):
                if bebida['quantidade'] > 0:
                    conteudo += f"\n{bebida['quantidade']}x {bebida['nome']}"
            for outro in prato.get('outros', []):
                if outro['quantidade'] > 0:
                    conteudo += f"\n{outro['quantidade']}x {outro['nome']}"

    conteudo += f"\n\nTotal: R$ {pedido['valor_total']:.2f}"
    conteudo += f"\nPagamento: {pedido['forma_pagamento']}"

    if pedido['forma_pagamento'] == "Dinheiro":
        try:
            troco_para = float(str(pedido.get("troco_para", 0)).replace("R$", "").replace(".", "").replace(",", "."))
        except:
            troco_para = 0

        troco = float(pedido.get("troco", 0))

        conteudo += f"\nTroco para: R$ {troco_para:.2f}"
        conteudo += f"\nTroco: R$ {troco:.2f}"

    return conteudo, 200, {
        'Content-Type': 'text/plain; charset=utf-8'
    }

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=False, host='0.0.0.0', port=port)
