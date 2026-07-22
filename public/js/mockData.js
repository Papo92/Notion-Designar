// Exact Notion Workspaces generated directly from Notion ZIP Export + Ventas Workspace
// Workspace 1: Designar Souvenirs 🎨
// Workspace 2: Expansión PD: Pensé en ti 🎁
// Workspace 3: Ventas & Juntas Semanales 💼

export const projectsList = [
  { id: 'designar', name: 'Designar Souvenirs 🎨', icon: '🎨' },
  { id: 'pense_en_ti', name: 'Expansión PD: Pensé en ti 🎁', icon: '🎁' },
  { id: 'ventas', name: 'Ventas & Juntas Semanales 💼', icon: '💼' }
];

export const initialMockStages = {
  designar: [
    { id: 10, name: '● No iniciado', sequence: 10, color: 'var(--column-gray)' },
    { id: 20, name: '● En curso', sequence: 20, color: 'var(--column-blue)' },
    { id: 30, name: '● Atrasado', sequence: 30, color: 'var(--column-pink)' },
    { id: 40, name: '● Terminado', sequence: 40, color: 'var(--column-emerald)' }
  ],
  pense_en_ti: [
    { id: 101, name: '● No iniciado', sequence: 10, color: 'var(--column-gray)' },
    { id: 102, name: '● Atrasado', sequence: 20, color: 'var(--column-pink)' },
    { id: 103, name: '● En curso', sequence: 30, color: 'var(--column-blue)' },
    { id: 104, name: '● Terminado', sequence: 40, color: 'var(--column-emerald)' }
  ],
  ventas: [
    { id: 201, name: '📌 Agenda / Pendientes', sequence: 10, color: 'var(--column-gray)' },
    { id: 202, name: '⚡ En Discusión / En Curso', sequence: 20, color: 'var(--column-blue)' },
    { id: 203, name: '📝 Bitácoras & Acuerdos', sequence: 30, color: 'var(--column-purple)' },
    { id: 204, name: '✅ Hitos Cumplidos', sequence: 40, color: 'var(--column-emerald)' }
  ]
};

export const initialMockTasks = [
  // 1. DESIGNAR SOUVENIRS - OFFICIAL NOTION CARDS & REAL SUBTASKS
  {
    id: 301,
    projectId: 'designar',
    name: 'Mercado Libre',
    stage_id: [10, '● No iniciado'],
    priority: '1',
    icon: '💳',
    user_ids: [
      { id: 2, name: 'Regina Manjarrez Martin', role: 'regina' },
      { id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }
    ],
    tag_ids: [{ id: 1, name: '🤝 Ventas Mayoreo', color: 'amber' }],
    date_deadline: '2026-04-21',
    cover_image: '',
    description: 'Integración y catálogo oficial de souvenirs en Mercado Libre.',
    subtasks: [
      { id: 1, text: 'Fotos ML', status: 'done', completed: true },
      { id: 2, text: 'Manual de procedimientos entregas', status: 'todo', completed: false },
      { id: 3, text: 'Precios mayoreo y menudeo', status: 'todo', completed: false },
      { id: 4, text: 'Copys y descripciones', status: 'todo', completed: false },
      { id: 5, text: 'Selección de productos', status: 'todo', completed: false },
      { id: 6, text: 'Agregar Colaborador', status: 'todo', completed: false }
    ],
    notes: 'Abril 2, 2026 → Abril 21, 2026'
  },
  {
    id: 302,
    projectId: 'designar',
    name: 'Automatización designar',
    stage_id: [10, '● No iniciado'],
    priority: '2',
    icon: '🤖',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2026-05-30',
    cover_image: '',
    description: 'Automatización de flujos de trabajo n8n y respuestas automáticas de clientes.',
    subtasks: [
      { id: 1, text: 'Calculadora para pago de maquila', status: 'done', completed: true },
      { id: 2, text: 'Presentación de odoo emmanuel', status: 'done', completed: true },
      { id: 3, text: 'Formatos de diseño', status: 'in_progress', completed: false },
      { id: 4, text: 'Capacitación odoo', status: 'in_progress', completed: false },
      { id: 5, text: 'Subir precios a odoo', status: 'in_progress', completed: false },
      { id: 6, text: 'Proceso de nuevos productos', status: 'todo', completed: false }
    ],
    notes: 'Mayo 30, 2026'
  },
  {
    id: 303,
    projectId: 'designar',
    name: 'Campañas META ads',
    stage_id: [20, '● En curso'],
    priority: '2',
    icon: '📢',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 3, name: '🌐 Expansión Nacional', color: 'blue' }],
    date_deadline: '2026-04-18',
    cover_image: '',
    description: 'Optimización de campañas en Meta Ads para generación de clientes potenciales.',
    subtasks: [
      { id: 1, text: 'Formulario de thelma', status: 'done', completed: true },
      { id: 2, text: 'Auditoría de audiencias Facebook', status: 'in_progress', completed: false },
      { id: 3, text: 'Nuevos creativos y anuncios de video', status: 'todo', completed: false }
    ],
    notes: 'Abril 18, 2026'
  },
  {
    id: 304,
    projectId: 'designar',
    name: 'Pagina web',
    stage_id: [20, '● En curso'],
    priority: '1',
    icon: '🌐',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 3, name: '🌐 Expansión Nacional', color: 'blue' }],
    date_deadline: '2026-05-15',
    cover_image: '',
    description: 'Actualización y rediseño de la tienda online con catálogo de souvenirs.',
    subtasks: [
      { id: 1, text: 'Pasarela de pagos en línea', status: 'in_progress', completed: false },
      { id: 2, text: 'Optimización SEO y velocidad de carga', status: 'todo', completed: false }
    ],
    notes: 'Mayo 15, 2026'
  },
  {
    id: 305,
    projectId: 'designar',
    name: 'Vendedoras 2026',
    stage_id: [30, '● Atrasado'],
    priority: '2',
    icon: '🎟️',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 1, name: '🤝 Ventas Mayoreo', color: 'amber' }, { id: 6, name: '🚨 Urgente', color: 'red' }],
    date_deadline: '2026-04-10',
    cover_image: '',
    description: 'Estrategia y comisión para la fuerza de ventas externa de souvenirs.',
    subtasks: [
      { id: 1, text: '% De vendedoras externas', status: 'done', completed: true },
      { id: 2, text: 'Reclutamiento y capacitación de vendedoras', status: 'todo', completed: false }
    ],
    notes: 'Abril 10, 2026'
  },
  {
    id: 306,
    projectId: 'designar',
    name: 'Setter AI',
    stage_id: [40, '● Terminado'],
    priority: '1',
    icon: '🤖',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2026-03-31',
    cover_image: '',
    description: 'Agente de Inteligencia Artificial para prospección automatizada por WhatsApp.',
    subtasks: [
      { id: 1, text: 'Integración API WhatsApp Business', status: 'done', completed: true },
      { id: 2, text: 'Pruebas de conversación y calificación', status: 'done', completed: true }
    ],
    notes: 'Marzo 31, 2026'
  },

  // 2. EXPANSIÓN PD: PENSÉ EN TI
  {
    id: 401,
    projectId: 'pense_en_ti',
    name: 'Inventario de la tienda',
    stage_id: [101, '● No iniciado'],
    priority: '1',
    icon: '📦',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 4, name: '📦 Inventario Tiendas', color: 'emerald' }],
    date_deadline: '2026-04-20',
    cover_image: '',
    description: 'Registro de existencias físicas y stock inicial para tienda de regalos.',
    subtasks: [
      { id: 1, text: 'Conteo físico de mercancía', status: 'todo', completed: false },
      { id: 2, text: 'Código de barras y etiquetado', status: 'todo', completed: false }
    ],
    notes: 'Abril 20, 2026'
  },
  {
    id: 402,
    projectId: 'pense_en_ti',
    name: 'Brochure Tienda',
    stage_id: [101, '● No iniciado'],
    priority: '0',
    icon: '🎨',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2026-05-10',
    cover_image: '',
    description: 'Diseño de catálogo y folleto digital para presentación de paquetes de obsequios.',
    subtasks: [
      { id: 1, text: 'Sesión fotográfica de productos', status: 'todo', completed: false }
    ],
    notes: 'Abril 21, 2026 → Mayo 10, 2026'
  },
  {
    id: 403,
    projectId: 'pense_en_ti',
    name: 'Buscar Locales',
    stage_id: [102, '● Atrasado'],
    priority: '2',
    icon: '📍',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 3, name: '🌐 Expansión Nacional', color: 'blue' }, { id: 6, name: '🚨 Urgente', color: 'red' }],
    date_deadline: '2026-06-04',
    cover_image: '',
    description: 'Búsqueda y prospección de nuevos locales comerciales para expansión.',
    subtasks: [
      { id: 1, text: 'Tabla para posibles ubicaciónes', status: 'todo', completed: false }
    ],
    notes: 'Mayo 11, 2026 → Junio 4, 2026'
  },
  {
    id: 404,
    projectId: 'pense_en_ti',
    name: 'Creación de nuevos productos',
    stage_id: [103, '● En curso'],
    priority: '1',
    icon: '📦',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2024-03-30',
    cover_image: '',
    description: 'Desarrollo de nuevas líneas de productos y regalos exclusivos.',
    subtasks: [
      { id: 1, text: 'Estudio de mercado', status: 'in_progress', completed: false },
      { id: 2, text: 'Desarrollo de conceptos creativos', status: 'in_progress', completed: false },
      { id: 3, text: 'Desarollo de empaques', status: 'in_progress', completed: false }
    ],
    notes: 'Marzo 24, 2024 → Marzo 30, 2024'
  },
  {
    id: 405,
    projectId: 'pense_en_ti',
    name: 'Dar de alta en el IMPI',
    stage_id: [104, '● Terminado'],
    priority: '1',
    icon: '⚖️',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 1, name: '🤝 Ventas Mayoreo', color: 'amber' }],
    date_deadline: '2026-04-01',
    cover_image: '',
    description: 'Registro oficial de marca e identidad ante el Instituto Mexicano de la Propiedad Industrial.',
    subtasks: [
      { id: 1, text: 'Búsqueda fonética de marca', status: 'done', completed: true },
      { id: 2, text: 'Pago de derechos e ingreso de solicitud', status: 'done', completed: true }
    ],
    notes: 'Registro de marca completado'
  },
  {
    id: 406,
    projectId: 'pense_en_ti',
    name: 'Manual de identidad',
    stage_id: [104, '● Terminado'],
    priority: '1',
    icon: '📘',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2026-04-15',
    cover_image: '',
    description: 'Manual de marca completo con logotipo, paleta de colores y tipografías.',
    subtasks: [
      { id: 1, text: 'Final', status: 'done', completed: true }
    ],
    notes: '100.00% completado'
  },

  // 3. VENTAS & JUNTAS SEMANALES
  {
    id: 501,
    projectId: 'ventas',
    name: 'Junta Semanal de Estrategia de Ventas (Bitácora)',
    stage_id: [203, '📝 Bitácoras & Acuerdos'],
    priority: '2',
    icon: '📅',
    user_ids: [
      { id: 1, name: 'Abelardo Navarrete', role: 'abelardo' },
      { id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }
    ],
    tag_ids: [{ id: 5, name: '📅 Junta Semanal', color: 'red' }, { id: 1, name: '🤝 Ventas VIP', color: 'amber' }],
    date_deadline: '2026-07-27',
    cover_image: '',
    description: 'Bitácora oficial de la junta semanal de socios. Revisión de metas de ingresos, prospección de clientes corporativos y compromisos de la semana.',
    subtasks: [
      { id: 1, text: 'Bitácora: Revisión de meta de ventas mensuales', status: 'done', completed: true },
      { id: 2, text: 'Compromiso Abelardo: Escalar campañas Meta Ads a $500/día', status: 'in_progress', completed: false },
      { id: 3, text: 'Compromiso Regina: Presentar catálogo impreso a 5 clientes VIP', status: 'in_progress', completed: false },
      { id: 4, text: 'Acuerdo: Ajuste de precios de envío para mayoristas', status: 'todo', completed: false },
      { id: 5, text: 'Minuta: Próxima junta Lunes 9:00 AM', status: 'todo', completed: false }
    ],
    notes: 'Junta Semanal de Socios'
  },
  {
    id: 502,
    projectId: 'ventas',
    name: 'Pipeline & Prospección Clientes VIP',
    stage_id: [202, '⚡ En Discusión / En Curso'],
    priority: '2',
    icon: '🤝',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 1, name: '🤝 Ventas VIP', color: 'amber' }, { id: 3, name: '🌐 Expansión Nacional', color: 'blue' }],
    date_deadline: '2026-08-05',
    cover_image: '',
    description: 'Seguimiento a cotizaciones enviadas a clientes corporativos y cadenas de hoteles boutique.',
    subtasks: [
      { id: 1, text: 'Seguimiento a 3 hoteles boutique en Cancún', status: 'in_progress', completed: false },
      { id: 2, text: 'Enviar muestras físicas de souvenirs ejecutivos', status: 'in_progress', completed: false },
      { id: 3, text: 'Cierre de contrato con distribuidor Puebla', status: 'todo', completed: false }
    ],
    notes: 'Prospección activa'
  },
  {
    id: 503,
    projectId: 'ventas',
    name: 'Revisión de Métricas ROAS & Conversión',
    stage_id: [201, '📌 Agenda / Pendientes'],
    priority: '1',
    icon: '📈',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 3, name: '🌐 Expansión Nacional', color: 'blue' }],
    date_deadline: '2026-08-01',
    cover_image: '',
    description: 'Análisis de retorno de inversión publicitaria (ROAS) en canales digitales y embudo de conversión.',
    subtasks: [
      { id: 1, text: 'Analizar costo por adquisición (CPA) en tienda en línea', status: 'todo', completed: false },
      { id: 2, text: 'Revisar tasa de rebote en checkout', status: 'todo', completed: false },
      { id: 3, text: 'Optimización de creativos de video para TikTok/IG', status: 'todo', completed: false }
    ],
    notes: 'Análisis semanal'
  },
  {
    id: 504,
    projectId: 'ventas',
    name: 'Cierre de Ventas Mes Anterior',
    stage_id: [204, '✅ Hitos Cumplidos'],
    priority: '1',
    icon: '🎯',
    user_ids: [
      { id: 1, name: 'Abelardo Navarrete', role: 'abelardo' },
      { id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }
    ],
    tag_ids: [{ id: 1, name: '🤝 Ventas VIP', color: 'amber' }],
    date_deadline: '2026-07-01',
    cover_image: '',
    description: 'Consolidación de ventas realizadas, facturación y dispersión de comisiones.',
    subtasks: [
      { id: 1, text: 'Reporte de ingresos acumulados mayo/junio', status: 'done', completed: true },
      { id: 2, text: 'Pago de comisiones a vendedoras externas', status: 'done', completed: true }
    ],
    notes: 'Hito cumplido'
  }
];
