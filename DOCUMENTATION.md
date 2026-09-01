# 📚 Documentação Técnica Detalhada | Spoleto Radar

## 1. Arquitetura do Sistema

```
src/
├── components/
│   ├── Header.jsx             # Barra de navegação superior e identidade visual oficial
│   ├── DashboardView.jsx      # Painel de controle executivo e gráfico pizza de gargalos
│   ├── NewVisitForm.jsx       # Formulário dinâmico modular de checklist de visita
│   ├── VisitReportModal.jsx   # Laudo oficial Spoleto e exportador de PDF/WhatsApp/Email
│   ├── ReportsView.jsx        # Relatórios com filtros por período e calendário customizado
│   ├── StoresView.jsx         # Diretório com as 409 lojas Spoleto de todo o Brasil
│   ├── ConsultantsView.jsx    # Gestão de consultores e atribuição exclusiva de lojas
│   └── TaxonomyView.jsx       # Editor de Tópicos Principais, Subtópicos e 3 Ações
├── context/
│   └── AppContext.jsx         # Estado global, persistência LocalStorage e handlers de CRUD
├── data/
│   └── initialData.js         # Base de 409 lojas, 20 categorias oficiais e visitas sementes
├── App.jsx                    # Chaveador de rotas de abas, container de modais e toasts
├── main.jsx                   # Ponto de entrada React com AppProvider
└── index.css                  # Design system oficial Spoleto Radar (Marrom, Ouro e Pastéis)
```

---

## 2. Taxonomia Oficial de 20 Temas Principais

| # | Tema Principal | Descrição Operacional |
|---|---|---|
| 1 | **FAT ABAIXO DO ORÇADO** | Faturamento bruto da unidade abaixo da meta orçada para o mês |
| 2 | **PRATO / PEDIDO ABAIXO DO ORÇADO** | Volume total de pratos e pedidos abaixo do planejado |
| 3 | **FAT ANO -1** | Comparativo de faturamento com o mesmo período do ano anterior (SSS) |
| 4 | **PEDIDO / PRATO ANO -1** | Volume de pratos/pedidos inferior ao mesmo período do ano anterior |
| 5 | **NPS** | Satisfação do cliente, pesquisa de bandeja (meta > 75%) e salão |
| 6 | **TEMPO MÉDIO DE SAÍDA** | Tempo de pista, cocção e entrega de pratos no balcão (< 8 min) |
| 7 | **DELIVERY** | Gestão de cancelamentos (< 1%), pausas, embalagens e despacho |
| 8 | **MIX DE VENDA** | Rentabilidade e participação de massas nobres, bebidas e sobremesas |
| 9 | **MASSA E MOLHO** | Ponto de cocção al dente, temperatura de réchaud e estoque mínimo |
| 10 | **CMV IDEAL VS. CMV REAL** | Desvio de Custo de Mercadoria Vendida, porcionamento e desperdício |
| 11 | **DRE** | Gestão financeira da franquia, custos fixos, energia e margem líquida |
| 12 | **ATENDIMENTO** | Hospitalidade, simpatia, velocidade no caixa e postura da equipe |
| 13 | **QUADRO DE COLABORADORES** | Dimensionamento da equipe, escalas de pico e assiduidade |
| 14 | **FIDELIDADE (MIO)** | Identificação de pedidos no programa Mio/Fidelidade (meta > 60%) |
| 15 | **MARKETING** | Materiais de PDV, campanhas vigentes e ativações de praça |
| 16 | **GOOGLE (Avaliações)** | Reputação online, nota do Google Meu Negócio e respostas a reviews |
| 17 | **PLATAFORMA DO PRATO** | Adesão aos cursos corporativos e capacitação contínua |
| 18 | **INFRAESTRUTURA & MANUTENÇÃO** | Reparos prediais, iluminação, exaustão e apontamentos de Q.A |
| 19 | **MANUTENÇÃO DO FORNO** | Sonda térmica, calibração, indução e pagers |
| 20 | **Q.A (QUALIDADE & PADRÃO)** | Conformidade com o checklist oficial TrigON e segurança alimentar |

---

## 3. Protocolos de Exportação e Compartilhamento de PDF

- O modal **VisitReportModal** isola o container da tabela com dimensões A4 proporcionais.
- O `html2canvas` renderiza o DOM com fator de escala 2x para garantir nitidez impecável em fontes e bordas.
- O `jspdf` gera o arquivo binário `.pdf` no formato padrão `Plano_de_Acao_Spoleto_[Loja]_[Data].pdf`.
- O método de disparo utiliza a **Web Share API** com `navigator.canShare({ files: [file] })` para envio nativo em celulares e tablets, e download com instrução de anexo no desktop.

---

## 4. Régua Automática de Prazos (SLA) & Envio de E-mails

### ⏰ Funcionamento da Régua Automática:
1. **Cálculo do Menor Prazo:** Para cada visita técnica, o sistema avalia todos os planos de ação não concluídos e elege o menor prazo como o **Gargalo Crítico da Visita**.
2. **Nível 1 • Alerta de Prevenção (D-1):** Disparado quando faltar 24h para o vencimento do menor prazo.
3. **Nível 2 • Escalação de Atenção Total (D-0 / Atraso):** Disparado no dia do vencimento ou se houver atraso, escalando para toda a liderança.
4. **Cadeia em Cópia Notificada:**
   - 🏬 Franqueado da Loja (Destinatário Principal)
   - 👨‍💼 Consultor de Negócios da Unidade (CC)
   - 🏢 Gerente Regional (CC)
   - 🌐 Gerente Nacional Liliane Cury (CC)
5. **Robô na Nuvem (Vercel Cron):** Executa automaticamente todo dia às 08:00 AM (BRT) na rota `/api/cron-sla` com proteção anti-duplicidade no Supabase.

---

## 📌 LEMBRETE: Configuração de Domínio para Envio Global de E-mails

> [!IMPORTANT]
> **Modo Atual (Desenvolvimento / Teste):**
> O Resend no plano gratuito permite envios de teste para a conta cadastrada (`lhukas@gmail.com`).
> 
> **Passo para Liberar Envio para Qualquer E-mail do Mundo (`@infodesk.net.br`, `@spoleto.com.br`, etc.):**
> 1. Acesse o painel do **[Resend](https://resend.com/domains)**.
> 2. Clique em **Add Domain** e insira o domínio corporativo desejado (ex: `infodesk.net.br` ou `spoleto.com.br`).
> 3. Adicione as 3 entradas DNS fornecidas (DKIM, SPF, MX) no provedor do seu domínio (Registro.br, Cloudflare, GoDaddy, etc.).
> 4. Após a validação (instantânea ou até 10 min), atualize o remetente em `api/cron-sla.js` e `src/services/notificationService.js` para `notificacoes@seudominio.com.br`.
> 5. A partir desse momento, os e-mails sairão automaticamente para todos os franqueados e gerentes da rede mundial!

