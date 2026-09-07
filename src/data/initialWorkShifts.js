// Escalas de Trabalho dos Colaboradores da Rede Spoleto
export const INITIAL_WORK_SHIFTS = [
  {
    id: 'shift-6x1',
    name: '6x1',
    label: '6x1 (Padrão Varejo / Shopping)',
    description: '6 dias de trabalho para 1 dia de descanso semanal remunerado. Padrão operacional de praças de alimentação.',
    badgeBg: '#F0FDF4',
    badgeColor: '#15803D',
    badgeBorder: '#BBF7D0'
  },
  {
    id: 'shift-5x2',
    name: '5x2',
    label: '5x2 (Comercial / Administrativo)',
    description: '5 dias de trabalho para 2 dias de folga (sábado e domingo). Típico de lojas corporativas e funções de suporte.',
    badgeBg: '#EFF6FF',
    badgeColor: '#1D4ED8',
    badgeBorder: '#BFDBFE'
  },
  {
    id: 'shift-12x36',
    name: '12x36',
    label: '12x36 (Jornada 12h)',
    description: '12 horas contínuas de trabalho seguidas por 36 horas ininterruptas de descanso. Comum em aeroportos e operações 24h.',
    badgeBg: '#FEF3C7',
    badgeColor: '#92400E',
    badgeBorder: '#FDE68A'
  },
  {
    id: 'shift-mista',
    name: 'Mista',
    label: 'Mista (Operação Combinada)',
    description: 'Operação mista onde parte do quadro opera 6x1 e lideranças/especialistas em 5x2 ou 12x36.',
    badgeBg: '#F3E8FF',
    badgeColor: '#6B21A8',
    badgeBorder: '#E9D5FF'
  }
];
