# 🍛 Marmitex da Alice

Sistema web completo para gerenciamento de pedidos de marmitas e pratos feitos, com cardápio dinâmico, emissão de recibos para impressão térmica e fechamento diário de vendas.

---

## 🚀 Tecnologias utilizadas

- Python / Flask
- Supabase (Banco de dados)
- Vercel (Deploy)
- HTML / Tailwind CSS / JavaScript

---

## ⚙️ Funcionalidades

### 👤 Autenticação

- Login com dois perfis:
  - Proprietário / Gestor
  - Funcionário

### 🧾 Gestão de pedidos

- Pedido de marmita e prato feito
- Suporte a múltiplos itens por pedido
- Numeração automática e sequencial por dia

### 🍽️ Personalização dos pedidos

- Adicionais, bebidas e outros itens com controle de quantidade

### 💳 Controle de pagamento

- Pix, Cartão e Dinheiro (com cálculo automático de troco)

### 🧾 Recibo e impressão

- Geração automática de recibo
- Layout otimizado para impressão térmica (58mm)
- Compatível com tablets e dispositivos móveis
- Impressão direta via navegador / integração com apps de impressão

### 🛠️ Administração

- Cardápio editável pelo Proprietário / Gestor
- Controle de acesso por perfil (segurança por sessão)

### 📊 Fechamento do dia

- Total vendido e total por forma de pagamento
- Quantidade de pedidos, marmitas e pratos vendidos
- Relatório detalhado de adicionais, bebidas e outros itens

---

## 🗄️ Banco de dados

O sistema utiliza **Supabase** para persistência dos dados:

- Pedidos (incluindo estrutura completa em JSON)
- Cardápio dinâmico
- Contador diário de pedidos

---

## 📋 Regras de negócio

Apenas o **Proprietário / Gestor** pode editar o cardápio e acessar o fechamento do dia. Funcionários podem lançar pedidos, mas não têm acesso a dados financeiros.

A numeração dos pedidos é sequencial, reiniciada diariamente e compartilhada entre marmitas e pratos feitos.

**Exemplo de numeração:**

```
Pedido 1 - Marmita
Pedido 2 - Prato feito
Pedido 3 - Marmita
```

---

## 🔄 Fluxo do sistema

```
Login → Escolha do pedido → Lançamento → Recibo → Impressão → Fechamento do dia
```

---

## 💡 Diferenciais

- Sistema 100% web (não requer instalação)
- Interface simples e otimizada para uso em balcão
- Compatível com tablets e smartphones
- Impressão térmica integrada
- Controle detalhado de vendas por item
- Estrutura escalável e preparada para evolução
- Separação clara entre operação (funcionário) e gestão (proprietário)

---

## 🌐 Deploy

Aplicação hospedada na **Vercel**, integrada com banco de dados **Supabase**.

---

## 🔐 Variáveis de ambiente

```env
SUPABASE_URL=
SUPABASE_KEY=
USUARIO_DONO=
SENHA_DONO=
USUARIO_FUNC=
SENHA_FUNC=
```

---

## 📌 Status do projeto

✅ Sistema em produção — pronto para uso em ambiente real.

---

## 📈 Possíveis melhorias futuras

- Histórico de fechamentos por data
- Dashboard com gráficos de vendas
- Exportação de relatórios em PDF
- Controle de caixa (entrada/saída)
- Multiusuário com níveis de permissão mais detalhados