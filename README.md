# 🍝 Spoleto Radar | Consultoria de Negócios 360 - Grupo Trigo

Plataforma oficial de **Consultoria de Negócios, Auditoria de Qualidade e Gestão de Planos de Ação Operacionais** para a rede de franquias **Spoleto & Grupo Trigo**.

---

## 📌 Visão Geral do Sistema

O **Spoleto Radar** foi desenvolvido para transformar o trabalho dos **Consultores de Negócios** em campo, permitindo diagnósticos operacionais ágeis, geração automática do **Plano de Ação Oficial Spoleto em PDF** em alta resolução e compartilhamento direto via WhatsApp e E-mail para os gerentes e franqueados das mais de 400 unidades em todo o Brasil.

---

## 🎨 Identidade Visual & Design Corporativo

- **Cores Oficiais**:
  - **Marrom Café Espresso Escuro** (`#2C1810`): Tom nobre, acolhedor e corporativo para headers, tabelas e botões.
  - **Dourado Nobre Spoleto** (`#C59B27`): Frisos finos, divisores e badges de destaque.
  - **Fundo Creme Quente** (`#FAF6F0`): Superfícies aconchegantes com tipografia serifada clássica (*Playfair Display*) e legível (*Plus Jakarta Sans*).
- **Status Oficiais do Plano de Ação**:
  - 🔴 **NÃO INICIADO**: Fundo coral pastel (`#FECACA`) com texto vinho (`#991B1B`).
  - 🟡 **EM ANDAMENTO**: Fundo amarelo pastel (`#FEF08A`) com texto âmbar (`#854D0E`).
  - 🟢 **CONCLUÍDO**: Fundo verde menta pastel (`#D8F3DC`) com texto verde floresta (`#1B4332`).

---

## 🚀 Principais Módulos & Funcionalidades

### 1. 📊 Painel Executivo (Dashboard)
- **KPIs em Tempo Real**: Total de visitas, planos de ação pendentes, taxa de resolução e lojas auditadas.
- **Gráfico de Pizza Interativo**: Itens de Oportunidade com percentuais e fatias destacáveis.
- **Feed de Visitas Recentes**: Acesso direto ao laudo de cada visita.

### 2. 📝 Nova Visita & Diagnóstico Modular
- **Seleção de Loja Inteligente**: Busca com autocompletar entre todas as **409 unidades Spoleto** cadastradas.
- **Tipo de Visita Compacto**: Alternador rápido entre *Visita Agendada* e *Visita Surpresa*.
- **Construtor Dinâmico de Tópicos**: Adicione quantos tópicos e subtópicos desejar na mesma visita com `+ Adicionar Outro Tópico`.
- **3 Planos de Ação Rápidos**: Pílulas de seleção de 1-clique com ações pré-configuradas ou campo livre de edição.
- **Definição de Responsável e Prazo**: Seletor de responsável (*Gerente e Equipe, Franqueado, Gerente e Franqueado, Colaboradores, Embaixador, Gerente, Consultor, Áreas Internas do Trigo*) e prazo (*Imediato, 24h, 48h, 7 dias, 15 dias, 30 dias*).

### 3. 📑 Laudo Oficial & Gerador de PDF
- Tabela idêntica à planilha oficial da rede Spoleto (*Data, Tema, Ação, Quem, Status, Prazo e Observação*).
- **Geração de PDF Real**: Renderização via `jspdf` + `html2canvas`.
- **Compartilhamento Direto**:
  - **Web Share API**: Disparo nativo do arquivo `.pdf` anexado direto para WhatsApp em dispositivos compatíveis.
  - **WhatsApp Web / E-mail**: Download automático do arquivo `.pdf` na pasta de Downloads com abertura de mensagem formatada.

### 4. 📈 Central de Relatórios & Inteligência Operacional
- Filtro avançado por **Período de Referência**:
  - *Todo o Histórico*
  - *Últimos 7 dias*
  - *Último mês*
  - *Últimos 3 meses*
  - *Último semestre*
  - *Último ano*
  - 📅 *Customizar período* (com seletores de calendário *De/Até*).
- Sub-abas: **Visitas Realizadas** e **Planos de Ação Individuais**.

### 5. 👥 Equipe de Consultores & Atribuição Exclusiva de Lojas
- Gestão dos Consultores de Negócios regionais.
- Modal **"Alterar Lojas"** com regra de **exclusividade estrita**:
  - Cada loja só pode estar atribuída a **um único consultor**.
  - Lojas atribuídas a outros consultores aparecem bloqueadas (`🔒`).
  - Ao desmarcar uma loja, ela fica imediatamente disponível (`🔓 Disponível`) para outros consultores.

### 6. ⚙️ Matriz de Tópicos & Edição Completa de Taxonomia
- **20 Tópicos Principais** oficiais consolidados.
- **100 Subtópicos** com severidades (*Leve, Média, Alta, Crítica*).
- **300 Planos de Ação Oficiais** pré-configurados.
- Ferramenta completa de **Edição e Exclusão** (`✏️ Editar Tópico` e `✏️ Editar Subtópico`).

---

## 🛠️ Stack Tecnológica

- **Frontend**: React 18, Vite 6, JavaScript moderno (ESNext)
- **Estilização**: Vanilla CSS com variáveis CSS tokens e tipografia Google Fonts
- **Ícones**: Lucide React
- **Exportação de Documentos**: jsPDF, html2canvas
- **Persistência**: LocalStorage com sincronização automática e dados padrão resilientes

---

## 💻 Como Rodar o Projeto Localmente

```bash
# 1. Navegue até a pasta do projeto
cd C:\vibecoding\spoleto-radar

# 2. Instale as dependências (se necessário)
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev

# 4. Acesse no navegador
http://localhost:5173/
```

---

## 🏛️ Grupo Trigo & Spoleto
*Documentação gerada automaticamente para a plataforma Spoleto Radar.*
