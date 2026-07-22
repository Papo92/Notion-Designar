// Exact Notion Workspaces generated directly from Notion ZIP Export
// Workspace 1: Designar Souvenirs 🎨
// Workspace 2: Expansión PD: Pensé en ti 🎁

export const projectsList = [
  { id: 'designar', name: 'Designar Souvenirs 🎨', icon: '🎨' },
  { id: 'pense_en_ti', name: 'Expansión PD: Pensé en ti 🎁', icon: '🎁' }
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
    date_deadline: '2026-05-19',
    cover_image: '',
    description: 'Campañas publicitarias de atracción de clientes corporativos en Facebook e Instagram.',
    subtasks: [
      { id: 1, text: 'Junta Thelma Manejo de meta ADS', status: 'done', completed: true },
      { id: 2, text: 'Formulario de thelma', status: 'done', completed: true },
      { id: 3, text: 'Dar acceso a Thelma a portafolio comercial', status: 'done', completed: true },
      { id: 4, text: 'Dar acceso a Thelma', status: 'todo', completed: false },
      { id: 5, text: 'Dar acceso a Thelma a portafolio', status: 'todo', completed: false },
      { id: 6, text: 'Subir todo el contenido fotos, videos, etc.', status: 'todo', completed: false }
    ],
    notes: 'Mayo 6, 2026 → Mayo 19, 2026'
  },
  {
    id: 304,
    projectId: 'designar',
    name: 'Pagina web',
    stage_id: [20, '● En curso'],
    priority: '1',
    icon: '🌐',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 3, name: '🌐 Expansión Nacional', color: 'blue' }],
    date_deadline: '2026-05-10',
    cover_image: '',
    description: 'Rediseño y catálogo digital interactivo de la página web oficial de Designar.',
    subtasks: [
      { id: 1, text: 'Configuración de odoo', status: 'todo', completed: false },
      { id: 2, text: 'Configuración de metodos de pagos', status: 'todo', completed: false },
      { id: 3, text: 'Redes sociales', status: 'todo', completed: false },
      { id: 4, text: 'Gráficos de paginas y template', status: 'todo', completed: false },
      { id: 5, text: 'SEO Google búsqueda orgánica', status: 'todo', completed: false }
    ],
    notes: 'Abril 21, 2026 → Mayo 10, 2026'
  },
  {
    id: 305,
    projectId: 'designar',
    name: 'Vendedoras 2026',
    stage_id: [30, '● Atrasado'],
    priority: '2',
    icon: '🎟️',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 6, name: '🚨 Urgente', color: 'red' }],
    date_deadline: '2026-06-30',
    cover_image: '',
    description: 'Reclutamiento y esquema de comisiones para equipo de vendedoras 2026.',
    subtasks: [
      { id: 1, text: '% De vendedoras externas', status: 'done', completed: true },
      { id: 2, text: '% De vendedoras internas', status: 'done', completed: true },
      { id: 3, text: 'Contratación de vendedoras nuevas', status: 'done', completed: true },
      { id: 4, text: 'Configuración pago comisiones en odoo', status: 'done', completed: true },
      { id: 5, text: 'Firma de contrato de Karla', status: 'done', completed: true },
      { id: 6, text: 'Auditoría de audiencias Facebook', status: 'done', completed: true },
      { id: 7, text: 'Entrevistas de vendedoras', status: 'in_progress', completed: false },
      { id: 8, text: 'Firma de Contrato Karina y Belem', status: 'in_progress', completed: false },
      { id: 9, text: 'Lanzar A/B Test (Mayo 6-12)', status: 'todo', completed: false },
      { id: 10, text: 'Onboarding vendedora interna 1', status: 'todo', completed: false },
      { id: 11, text: 'Validación vendedora interna (30 junio)', status: 'todo', completed: false }
    ],
    notes: 'Abril 21, 2026 → Junio 30, 2026'
  },
  {
    id: 306,
    projectId: 'designar',
    name: 'Setter AI',
    stage_id: [40, '● Terminado'],
    priority: '1',
    icon: '🤖',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 1, name: '🤝 Ventas Mayoreo', color: 'amber' }],
    date_deadline: '2026-05-10',
    cover_image: '',
    description: 'Implementación del agente de IA para agendar citas de prospectos de mayoreo.',
    subtasks: [
      { id: 1, text: 'Limitar diseños', status: 'done', completed: true },
      { id: 2, text: 'Envío de imágenes y videos', status: 'done', completed: true },
      { id: 3, text: 'Envío de archivos', status: 'done', completed: true },
      { id: 4, text: 'AVISAR AL EQUIPO DE VENTAS', status: 'todo', completed: false }
    ],
    notes: 'Mayo 1, 2026 → Mayo 10, 2026'
  },

  // 2. EXPANSIÓN PD: PENSÉ EN TI - OFFICIAL NOTION CARDS & REAL SUBTASKS
  {
    id: 401,
    projectId: 'pense_en_ti',
    name: 'Inventario de la tienda',
    stage_id: [101, '● No iniciado'],
    priority: '1',
    icon: '📦',
    user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
    tag_ids: [{ id: 4, name: '📦 Inventario Tiendas', color: 'emerald' }],
    date_deadline: '2026-04-30',
    cover_image: '',
    description: 'Registro de stock e inventario completo para la tienda PD. Pensé en ti.',
    subtasks: [
      { id: 1, text: 'Cotización Odoo', status: 'done', completed: true }
    ],
    notes: 'Abril 21, 2026 → Abril 30, 2026'
  },
  {
    id: 402,
    projectId: 'pense_en_ti',
    name: 'Brochure Tienda',
    stage_id: [101, '● No iniciado'],
    priority: '1',
    icon: '🎨',
    user_ids: [{ id: 2, name: 'Regina Manjarrez Martin', role: 'regina' }],
    tag_ids: [{ id: 2, name: '🎨 Producción', color: 'purple' }],
    date_deadline: '2026-05-10',
    cover_image: '',
    description: 'Diseño e impresión del brochure impreso y digital de la tienda.',
    subtasks: [
      { id: 1, text: 'Manuales de Procesos', status: 'todo', completed: false },
      { id: 2, text: 'Renders del espacio', status: 'todo', completed: false },
      { id: 3, text: 'Definir estilo de la tienda', status: 'todo', completed: false }
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
  }
];
