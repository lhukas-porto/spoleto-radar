# Especificação Funcional & Ideias: Agenda de Gestão de Visitas (Spoleto Radar)

**Data de Registro:** 07 de Setembro de 2026  
**Status:** Guardado para implementação sob demanda.

---

## 📌 Objetivo Principal
Transformar o Spoleto Radar de uma ferramenta que apenas registra o passado (visitas realizadas) em uma plataforma completa de planejamento e coordenação de campo (estilo Google Calendar integrado à operação Spoleto).

---

## 🗺️ 1. Posicionamento na Interface
- **Menu Principal (Header):**
  - Nova aba ao lado de "Nova Visita": **`📅 Agenda de Visitas`**
  - Badge dinâmico indicando quantas visitas estão programadas para hoje ou pendentes.

---

## 🗓️ 2. Modos de Visualização (Híbrido)
1. **Grade de Calendário (Mês / Semana):**
   - Estilo Google Calendar com os cards de visitas marcados nas cores da marca Spoleto.
   - Clique em qualquer dia para adicionar um novo agendamento de visita rapidamente.
2. **Visão Linha do Tempo / Lista Inteligente:**
   - Agrupamento em: *Hoje*, *Esta Semana*, *Próximas Semanas*, *Atrasadas*.
   - Alta usabilidade no mobile e no tablet do consultor em campo.

---

## 🔍 3. Filtros Estratégicos
- **Por Consultor / Liderança:** Visão geral da equipe ou visão focada individual.
- **Por Regional / Sub-regional:** Ex: Rio de Janeiro, São Paulo, Centro-Oeste, etc.
- **Por Status:**
  - 🟡 **Agendada / Prevista**
  - 🟢 **Realizada / Concluída** (com tick)
  - 🔴 **Em Atraso** (passou da data limite)
  - ⚪ **Remarcada / Cancelada**

---

## ✅ 4. O Mecanismo do "Ticar" (Check de Visita Feita)
- **Check Rápido:** Marcar como concluída na hora com carimbo de data/hora e nota rápida.
- **Transição Direta para Relatório:** Ao ticar, atalho para abrir o formulário de "Nova Visita" já com Loja, Consultor, Data e Objetivo pré-preenchidos.

---

## ⚡ 5. Recursos Adicionais de Valor
- **Tipo / Objetivo da Visita:** Rotina Operacional, Auditoria de DRE, Treinamento, Inauguração, Reunião de Franquia.
- **Exportação (.ics / Google Calendar):** Sincronização direta com a agenda do celular/notebook do consultor.
- **Vínculo com o Store Profile:** Na ficha individual de cada loja, exibir quando foi a última visita e a data da próxima visita agendada.
