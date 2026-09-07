# Ideias e Especificação: Banda de Preço das Lojas (Spoleto Radar)

> **Status:** Guardado para implementação sob demanda.
> **Solicitante:** Lucas
> **Gatilho:** Apresentar imediatamente quando o Lucas mencionar "banda" ou "banda de preço".

---

## 📌 Contexto & Objetivo
No ecossistema de franquias Spoleto (Grupo Trigo), as lojas operam em diferentes praças (shoppings nobres, aeroportos, lojas de rua, centros urbanos e interior). A **Banda de Preço** (*Price Tier*) determina a tabela de preços do cardápio aplicável a cada restaurante.

O objetivo é adicionar na **Rede de Lojas** um campo **editável** de banda de preço por loja.

---

## 💡 Propostas de Estruturação

### 1. Nomenclatura das Bandas
* **Opção 1 (Numérica Tradicional):**
  * `Banda 1 (Econômica / Base)` — Lojas de rua e cidades com menor tíquete médio
  * `Banda 2 (Padrão / Standard)` — Tabela oficial padrão nacional
  * `Banda 3 (Shopping / Premium)` — Shoppings de alto fluxo e capitais
  * `Banda 4 (Super Premium / Aeroportos)` — Operações em pontos nobres (Guarulhos, Santos Dumont, Galeão, etc.)
  * `Banda 5 (Especial / Eventos)`
* **Opção 2 (Letras):**
  * `Banda A` | `Banda B` | `Banda C` | `Banda D` | `Banda E`
* **Opção 3 (Híbrida com Lista Prévia e Campo Livre):**
  * Seletor com as bandas homologadas + permissão para digitar códigos internos (ex: `Banda SP-01`, `Banda Aeroporto`).

---

## 🛠️ Onde Exibir & Como Editar

1. **Card da Loja (Rede de Lojas):**
   * Badge visual colorido no topo do card (ex: 🟢 Banda 1, 🔵 Banda 2, 🟡 Banda 3, 🟣 Banda 4).
   * **Edição Rápida (Inline / Click-to-Edit):** O consultor pode clicar na tag para trocar a banda na hora, sem precisar entrar no modo de edição completo.
2. **Formulários de Loja (Criar & Editar):**
   * Campo dedicado: `Banda de Preço *` com select pesquisável ou combobox.
3. **Ficha 360º da Loja:**
   * Exibição em destaque no cabeçalho da loja (junto a Franqueado, Administradora e Contrato).
4. **Filtro Superior da Rede de Lojas:**
   * Filtro rápido: *"Todas as Bandas | Banda 1 | Banda 2 | Banda 3..."* para cruzar roteiros de consultoria por faixa de preço.
