// Matriz de Controle de Acesso e Permissões por Cargo (RBAC) - Rede Spoleto
// Cargos: DIRETORIA | GERENTE_NACIONAL | GERENTE_REGIONAL | CONSULTOR

export const DEFAULT_ROLES = [
  { id: 'DIRETORIA', name: 'Diretoria', label: 'Diretoria Nacional', icon: 'Crown', color: '#B45309' },
  { id: 'GERENTE_NACIONAL', name: 'Gerente Nacional', label: 'Gerência Geral Spoleto', icon: 'Target', color: '#D97706' },
  { id: 'GERENTE_REGIONAL', name: 'Gerente Regional', label: 'Liderança de Polo Regional', icon: 'Compass', color: '#2563EB' },
  { id: 'CONSULTOR', name: 'Consultores', label: 'Consultores de Negócios (Ponta)', icon: 'Briefcase', color: '#16A34A' },
];

export const DEFAULT_MODULES = [
  {
    id: 'dashboard',
    category: 'Dashboard & Indicadores',
    name: 'Visão Executiva & Faturamento',
    description: 'Acesso a faturamento estimado, notas de visita e NPS da rede.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Visão Brasil completa' },
      GERENTE_NACIONAL: { enabled: true, note: 'Visão Brasil por polos' },
      GERENTE_REGIONAL: { enabled: true, note: 'Filtrado por sua região' },
      CONSULTOR: { enabled: true, note: 'Filtrado pela sua carteira' },
    }
  },
  {
    id: 'new_visit',
    category: 'Visitas & Diagnósticos',
    name: 'Realizar Visita de Consultoria',
    description: 'Criar novos diagnósticos operacionais e check-ins nas lojas.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Pode aplicar visitas extraordinárias' },
      GERENTE_NACIONAL: { enabled: true, note: 'Pode acompanhar e abrir visitas' },
      GERENTE_REGIONAL: { enabled: true, note: 'Aplica em qualquer loja do polo' },
      CONSULTOR: { enabled: true, note: 'Função primária de campo' },
    }
  },
  {
    id: 'edit_visit',
    category: 'Visitas & Diagnósticos',
    name: 'Editar & Excluir Relatórios',
    description: 'Modificar dados já preenchidos e assinados de visitas anteriores.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Controle irrestrito de auditoria' },
      GERENTE_NACIONAL: { enabled: true, note: 'Permitido mediante alinhamento' },
      GERENTE_REGIONAL: { enabled: true, note: 'Apenas visitas da sua regional' },
      CONSULTOR: { enabled: false, note: 'Bloqueado após assinatura digital' },
    }
  },
  {
    id: 'action_plan_status',
    category: 'Planos de Ação',
    name: 'Baixar / Prorrogar Planos de Ação',
    description: 'Mudar status para Concluído, Em Andamento ou prorrogar prazo de execução.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Aprovação final' },
      GERENTE_NACIONAL: { enabled: true, note: 'Aprovação em escalações' },
      GERENTE_REGIONAL: { enabled: true, note: 'Aprova prorrogação até 7 dias' },
      CONSULTOR: { enabled: true, note: 'Valida na visita in-loco' },
    }
  },
  {
    id: 'assign_internal_area',
    category: 'Planos de Ação',
    name: 'Acionar Áreas Internas Franqueadora',
    description: 'Direcionar ações para Marketing, P&D, TI, Logística, etc.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Totalmente liberado' },
      GERENTE_NACIONAL: { enabled: true, note: 'Totalmente liberado' },
      GERENTE_REGIONAL: { enabled: true, note: 'Totalmente liberado' },
      CONSULTOR: { enabled: true, note: 'Abre chamados operacionais' },
    }
  },
  {
    id: 'price_band_edit',
    category: 'Gestão da Rede de Lojas',
    name: 'Editar Banda de Preço da Loja',
    description: 'Alterar a classificação tarifária de cardápio da unidade.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Definição estratégica de pricing' },
      GERENTE_NACIONAL: { enabled: true, note: 'Revisão orçamentária nacional' },
      GERENTE_REGIONAL: { enabled: false, note: 'Apenas sugestão / sob aprovação' },
      CONSULTOR: { enabled: false, note: 'Somente leitura' },
    }
  },
  {
    id: 'store_profile_edit',
    category: 'Gestão da Rede de Lojas',
    name: 'Editar Dados Cadastrais & Franqueados',
    description: 'Atualizar telefone, endereço, contatos e quadro de funcionários da loja.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Acesso total' },
      GERENTE_NACIONAL: { enabled: true, note: 'Acesso total' },
      GERENTE_REGIONAL: { enabled: true, note: 'Lojas da regional' },
      CONSULTOR: { enabled: true, note: 'Lojas da carteira' },
    }
  },
  {
    id: 'add_franchisee',
    category: 'Franqueados & Parceiros',
    name: 'Cadastrar / Editar Franqueados',
    description: 'Cadastrar novos franqueados, editar contatos e vincular restaurantes aos operadores.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Liberado' },
      GERENTE_NACIONAL: { enabled: true, note: 'Liberado' },
      GERENTE_REGIONAL: { enabled: true, note: 'Liberado' },
      CONSULTOR: { enabled: true, note: 'Pode cadastrar e atualizar franqueados da carteira' },
    }
  },
  {
    id: 'add_team_member',
    category: 'Gestão da Equipe',
    name: 'Cadastrar Novos Membros da Equipe',
    description: 'Adicionar novos colaboradores à rede Spoleto respeitando a hierarquia.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Pode cadastrar todos os níveis' },
      GERENTE_NACIONAL: { enabled: true, note: 'Pode cadastrar Gerentes Regionais e Consultores' },
      GERENTE_REGIONAL: { enabled: true, note: 'Pode cadastrar Consultores de Negócios' },
      CONSULTOR: { enabled: false, note: 'Não pode cadastrar membros da equipe' },
    }
  },
  {
    id: 'reassign_consultant',
    category: 'Gestão da Equipe',
    name: 'Redistribuir Carteira de Lojas',
    description: 'Transferir lojas entre consultores e alterar estrutura de liderança.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Organograma nacional' },
      GERENTE_NACIONAL: { enabled: true, note: 'Alocação de capacidade de equipe' },
      GERENTE_REGIONAL: { enabled: false, note: 'Requer validação nacional' },
      CONSULTOR: { enabled: false, note: 'Sem acesso' },
    }
  },
  {
    id: 'settings_taxonomy',
    category: 'Configurações do Sistema',
    name: 'Gerenciar Matriz de Tópicos (20 Áreas)',
    description: 'Criar, editar e excluir tópicos e subproblemas da consultoria.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Padrão da marca Spoleto' },
      GERENTE_NACIONAL: { enabled: true, note: 'Alinhamento operacional' },
      GERENTE_REGIONAL: { enabled: false, note: 'Bloqueado' },
      CONSULTOR: { enabled: false, note: 'Bloqueado' },
    }
  },
  {
    id: 'settings_internal_areas',
    category: 'Configurações do Sistema',
    name: 'Gerenciar Cadastro de Áreas Internas',
    description: 'Cadastrar novos setores corporativos do Grupo Trigo / Spoleto.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Governança corporativa' },
      GERENTE_NACIONAL: { enabled: true, note: 'Governança corporativa' },
      GERENTE_REGIONAL: { enabled: false, note: 'Bloqueado' },
      CONSULTOR: { enabled: false, note: 'Bloqueado' },
    }
  },
  {
    id: 'settings_regions',
    category: 'Configurações do Sistema',
    name: 'Gerenciar Regiões & Polos Operacionais',
    description: 'Criar, renomear e excluir os polos regionais oficiais de alocação de equipe.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Pode gerenciar todos os polos' },
      GERENTE_NACIONAL: { enabled: true, note: 'Pode gerenciar polos da rede' },
      GERENTE_REGIONAL: { enabled: false, note: 'Somente leitura' },
      CONSULTOR: { enabled: false, note: 'Bloqueado' },
    }
  },
  {
    id: 'settings_work_shifts',
    category: 'Configurações do Sistema',
    name: 'Gerenciar Escalas de Colaboradores',
    description: 'Cadastrar, renomear e configurar parâmetros das escalas de trabalho das equipes (6x1, 5x2, 12x36, etc).',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Governança de RH & Operações' },
      GERENTE_NACIONAL: { enabled: true, note: 'Alinhamento operacional nacional' },
      GERENTE_REGIONAL: { enabled: false, note: 'Somente leitura' },
      CONSULTOR: { enabled: false, note: 'Bloqueado' },
    }
  },
  {
    id: 'export_reports',
    category: 'Relatórios & Exportação',
    name: 'Exportar Relatórios (PDF / WhatsApp)',
    description: 'Gerar dossiês executivos e disparar mensagens automáticas de cobrança.',
    permissions: {
      DIRETORIA: { enabled: true, note: 'Qualquer unidade do Brasil' },
      GERENTE_NACIONAL: { enabled: true, note: 'Qualquer unidade do Brasil' },
      GERENTE_REGIONAL: { enabled: true, note: 'Unidades do seu polo' },
      CONSULTOR: { enabled: true, note: 'Unidades da sua carteira' },
    }
  }
];
