import { odooClient } from './odooApi.js';
import { projectsList, initialMockStages } from './mockData.js';

function getAvailableTags() {
  const stored = localStorage.getItem('notion_custom_tags');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return [
    { id: 1, name: '🤝 Ventas VIP', color: 'amber' },
    { id: 2, name: '🎨 Producción', color: 'purple' },
    { id: 3, name: '🌐 Expansión Nacional', color: 'blue' },
    { id: 4, name: '📦 Inventario Tiendas', color: 'emerald' },
    { id: 5, name: '📅 Junta Semanal', color: 'red' },
    { id: 6, name: '🚨 Urgente', color: 'red' }
  ];
}

function saveAvailableTags(tags) {
  localStorage.setItem('notion_custom_tags', JSON.stringify(tags));
}

// Escapa texto antes de interpolarlo en HTML (atributos value="..." incluidos).
// Sin esto, un valor como: Lona 12" x 18"  se corta en la primera comilla.
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// IDs únicos: Date.now() colisiona cuando se crean dos elementos en el mismo
// milisegundo (los handlers son síncronos), y luego borrar uno borra los dos.
let __lastUid = 0;
function uid() {
  __lastUid = Math.max(Date.now(), __lastUid + 1);
  return __lastUid;
}

// Compara por día LOCAL. `new Date('2026-07-31')` se interpreta como medianoche
// UTC, que en UTC-6 ya es pasado: una tarea que vence hoy salía como atrasada.
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const parts = String(dateStr).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(parts[0], parts[1] - 1, parts[2]) < hoy;
}

const STAGE_COLORS = [
  'var(--column-blue)',
  'var(--column-amber)',
  'var(--column-purple)',
  'var(--column-pink)',
  'var(--column-emerald)',
  'var(--column-gray)'
];

// Debe quedar por debajo del límite de cuerpo del servidor (100mb en base64).
const MAX_UPLOAD_MB = 70;

const EMOJI_PRESETS =['💳', '🤖', '📢', '🌐', '🎟️', '📦', '📍', '⚖️', '📘', '🎨', '🎁', '📅', '🚀', '📊', '💼', '📄'];

class NotionKanbanApp {
  constructor() {
    this.currentProjectId = localStorage.getItem('notion_active_project') || 'designar';
    this.currentViewMode = localStorage.getItem('notion_active_view') || 'board';
    this.activePartnerFilter = localStorage.getItem('notion_active_partner') || 'all';
    this.stages = [];
    this.tasks = [];
    this.undoHistory = []; // Stack for Ctrl+Z undo support
    this.draggedTaskId = null;
    this.draggedSubtaskId = null;
    this.searchQuery = '';

    this.initElements();
    this.bindEvents();
    this.initUndoSystem();
  }

  async init() {
    this.restoreActiveUIState();
    this.updateStatusBadge();
    await this.loadData();
  }

  initElements() {
    this.boardEl = document.getElementById('kanban-board');
    this.statusBadgeEl = document.getElementById('status-badge');
    this.statusTextEl = document.getElementById('status-text');
    this.searchInputEl = document.getElementById('search-input');
    this.darkModeBtnEl = document.getElementById('dark-mode-toggle');
    this.resetCacheBtnEl = document.getElementById('reset-cache-btn');
    this.odooConfigBtnEl = document.getElementById('odoo-config-btn');
    this.newCardBtnEl = document.getElementById('new-card-btn');
    this.projectSelectEl = document.getElementById('project-select');

    // View tabs
    this.viewTabs = document.querySelectorAll('.view-tab');

    // Partner filter buttons
    this.partnerBtns = document.querySelectorAll('.partner-btn');

    // Modals
    this.configModalEl = document.getElementById('config-modal');
    this.configFormEl = document.getElementById('config-form');
    this.closeConfigBtnEl = document.getElementById('close-config');
    this.demoToggleEl = document.getElementById('demo-mode-checkbox');

    this.detailModalEl = document.getElementById('detail-modal');
    this.detailModalBodyEl = document.getElementById('detail-modal-body');
    this.closeDetailBtnEl = document.getElementById('close-detail');

    // Toast Container
    let toastContainer = document.querySelector('.undo-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'undo-toast-container';
      document.body.appendChild(toastContainer);
    }
    this.toastContainerEl = toastContainer;
  }

  initUndoSystem() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        e.preventDefault();
        this.performUndo();
      }
    });
  }

  pushUndoAction(message, restoreFn) {
    const action = { message, restoreFn };
    this.undoHistory.push(action);
    this.showUndoToast(message, action);
  }

  performUndo() {
    if (this.undoHistory.length === 0) return;
    const lastAction = this.undoHistory.pop();
    if (lastAction && typeof lastAction.restoreFn === 'function') {
      lastAction.restoreFn();
      odooClient.persistDemo();
      this.renderCurrentView();
      this.showToast(`↩️ Acción restaurada: ${lastAction.message}`);
    }
  }

  showUndoToast(message, action) {
    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    toast.innerHTML = `
      <span>🗑️ ${message}</span>
      <button class="undo-btn-action">Deshacer ↩️</button>
    `;

    const undoBtn = toast.querySelector('.undo-btn-action');
    undoBtn.addEventListener('click', () => {
      action.restoreFn();
      odooClient.persistDemo();
      this.undoHistory = this.undoHistory.filter(a => a !== action);
      toast.remove();
      this.renderCurrentView();
      this.showToast('↩️ Elemento restaurado con éxito');
    });

    this.toastContainerEl.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 7000);
  }

  showToast(text) {
    const toast = document.createElement('div');
    toast.className = 'undo-toast';
    toast.style.backgroundColor = '#10b981';
    toast.innerHTML = `<span>${text}</span>`;
    this.toastContainerEl.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
  }

  restoreActiveUIState() {
    if (this.projectSelectEl) {
      this.projectSelectEl.value = this.currentProjectId;
    }
    this.viewTabs.forEach(tab => {
      if (tab.dataset.view === this.currentViewMode) {
        this.viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      }
    });
    this.partnerBtns.forEach(btn => {
      if (btn.dataset.filter === this.activePartnerFilter) {
        this.partnerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  }

  bindEvents() {
    if (this.projectSelectEl) {
      this.projectSelectEl.addEventListener('change', (e) => {
        this.currentProjectId = e.target.value;
        localStorage.setItem('notion_active_project', e.target.value);
        this.loadData();
      });
    }

    this.viewTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.viewTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentViewMode = tab.dataset.view || 'board';
        localStorage.setItem('notion_active_view', this.currentViewMode);
        this.renderCurrentView();
      });
    });

    this.partnerBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.partnerBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.activePartnerFilter = btn.dataset.filter || 'all';
        localStorage.setItem('notion_active_partner', this.activePartnerFilter);
        this.renderCurrentView();
      });
    });

    if (this.searchInputEl) {
      this.searchInputEl.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.renderCurrentView();
      });
    }

    if (this.darkModeBtnEl) {
      const updateIcon = () => {
        const isDark = document.body.classList.contains('dark-mode');
        this.darkModeBtnEl.innerHTML = isDark ? '☀️ <span class="dark-mode-label" style="font-size:11px; font-weight:600;">Claro</span>' : '🌙 <span class="dark-mode-label" style="font-size:11px; font-weight:600;">Oscuro</span>';
        this.darkModeBtnEl.title = isDark ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';
      };

      this.darkModeBtnEl.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('notion_dark_mode', isDark ? 'true' : 'false');
        updateIcon();
      });

      if (localStorage.getItem('notion_dark_mode') === 'true') {
        document.body.classList.add('dark-mode');
      }
      updateIcon();
    }

    if (this.odooConfigBtnEl) this.odooConfigBtnEl.addEventListener('click', () => this.openConfigModal());
    if (this.closeConfigBtnEl) this.closeConfigBtnEl.addEventListener('click', () => this.closeConfigModal());
    if (this.configFormEl) this.configFormEl.addEventListener('submit', (e) => this.handleConfigSubmit(e));
    if (this.demoToggleEl) {
      this.demoToggleEl.addEventListener('change', (e) => {
        const demoFields = document.getElementById('odoo-fields');
        if (demoFields) demoFields.style.display = e.target.checked ? 'none' : 'flex';
      });
    }

    if (this.closeDetailBtnEl) this.closeDetailBtnEl.addEventListener('click', () => this.closeDetailModal());

    if (this.newCardBtnEl) {
      this.newCardBtnEl.addEventListener('click', () => {
        if (this.stages.length === 0) return;

        // El formulario rápido se inserta DENTRO de una columna del tablero.
        // Antes se llamaba sin `colEl`, así que quedaba fuera del DOM y el botón
        // no hacía nada visible. Desde Tabla o Galería hay que volver al Kanban.
        if (this.currentViewMode !== 'board') {
          this.currentViewMode = 'board';
          localStorage.setItem('notion_active_view', 'board');
          this.viewTabs.forEach(t => t.classList.toggle('active', t.dataset.view === 'board'));
          this.renderCurrentView();
        }

        const firstCol = this.boardEl.querySelector('.kanban-column');
        if (firstCol) {
          this.promptNewCard(Number(firstCol.dataset.stageId), firstCol.dataset.stageName, firstCol);
        }
      });
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.configModalEl) this.closeConfigModal();
      if (e.target === this.detailModalEl) this.closeDetailModal();
    });
  }

  updateStatusBadge() {
    const activeProj = projectsList.find(p => p.id === this.currentProjectId);
    const projName = activeProj ? activeProj.name : 'Designar Souvenirs';

    if (odooClient.isDemoMode()) {
      this.statusBadgeEl.className = 'status-badge demo';
      this.statusTextEl.textContent = `Proyecto: ${projName}`;
    } else {
      this.statusBadgeEl.className = 'status-badge';
      this.statusTextEl.textContent = `Conectado Odoo (${odooClient.config.model})`;
    }

    if (this.newCardBtnEl) {
      this.newCardBtnEl.textContent = '+ Nueva Tarea';
    }
  }

  async loadData() {
    this.boardEl.innerHTML = `<div style="padding: 40px; color: var(--text-muted);">Cargando vista Notion...</div>`;
    try {
      this.stages = await odooClient.getStages(this.currentProjectId);
      this.tasks = await odooClient.getTasks();
      this.updateStatusBadge();
      this.renderCurrentView();
    } catch (err) {
      console.error('Error cargando datos:', err);
      this.boardEl.innerHTML = `<div style="padding: 40px; color: #ef4444;">Error al cargar datos: ${err.message}</div>`;
    }
  }

  getFilteredTasks() {
    return this.tasks.filter(t => {
      const taskProjectId = t.projectId || 'designar';
      if (odooClient.isDemoMode() && taskProjectId !== this.currentProjectId) {
        return false;
      }

      if (this.searchQuery) {
        const matchName = (t.name || '').toLowerCase().includes(this.searchQuery);
        const matchDesc = (t.description || '').toLowerCase().includes(this.searchQuery);
        if (!matchName && !matchDesc) return false;
      }

      if (this.activePartnerFilter === 'abelardo') {
        return Array.isArray(t.user_ids) && t.user_ids.some(u => (u.name || '').toLowerCase().includes('abelardo') || u.role === 'abelardo');
      }
      if (this.activePartnerFilter === 'regina') {
        return Array.isArray(t.user_ids) && t.user_ids.some(u => (u.name || '').toLowerCase().includes('regina') || u.role === 'regina');
      }
      if (this.activePartnerFilter === 'both') {
        return Array.isArray(t.user_ids) && t.user_ids.length > 1;
      }
      if (this.activePartnerFilter === 'urgent') {
        return Number(t.priority) >= 2 || isOverdue(t.date_deadline);
      }

      return true;
    });
  }

  calculateProgress(task) {
    if (!Array.isArray(task.subtasks) || task.subtasks.length === 0) {
      const currentStageId = Array.isArray(task.stage_id) ? task.stage_id[0] : task.stage_id;
      const index = this.stages.findIndex(s => Number(s.id) === Number(currentStageId));
      if (index === -1) return 0;
      return Math.round(((index + 1) / this.stages.length) * 100);
    }

    const completed = task.subtasks.filter(s => s.status === 'done' || s.completed).length;
    return Math.round((completed / task.subtasks.length) * 100);
  }

  renderCurrentView() {
    if (this.currentViewMode === 'table') {
      this.renderTableView();
    } else if (this.currentViewMode === 'gallery') {
      this.renderGalleryView();
    } else {
      this.renderBoardView();
    }
  }

  renderBoardView() {
    this.boardEl.innerHTML = '';
    this.boardEl.className = 'kanban-board';

    const filteredTasks = this.getFilteredTasks();

    this.stages.forEach((stage, idx) => {
      const stageTasks = filteredTasks.filter(t => {
        const tStageId = Array.isArray(t.stage_id) ? t.stage_id[0] : t.stage_id;
        return Number(tStageId) === Number(stage.id);
      });

      const colEl = document.createElement('div');
      colEl.className = 'kanban-column';
      colEl.dataset.stageId = stage.id;
      colEl.dataset.stageName = stage.name;

      colEl.innerHTML = `
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-color-indicator" style="background-color: ${esc(stage.color)};" title="Haz clic para cambiar color de la columna"></span>
            <span class="column-title" title="Haz clic para renombrar la columna">${esc(stage.name)}</span>
            <span class="column-count">${stageTasks.length}</span>
          </div>
          <div class="column-actions">
            ${idx > 0 ? `<button class="column-move-btn move-col-left" data-index="${idx}" title="Mover columna a la izquierda">◀</button>` : ''}
            ${idx < this.stages.length - 1 ? `<button class="column-move-btn move-col-right" data-index="${idx}" title="Mover columna a la derecha">▶</button>` : ''}
            <button class="column-move-btn column-delete-btn" data-stage-id="${stage.id}" title="Eliminar etapa (esquina superior derecha)">🗑️</button>
            <button class="icon-btn-subtle add-card-icon-btn" title="Añadir tarjeta">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
        <div class="cards-container" id="cards-container-${stage.id}"></div>
        <button class="quick-add-btn">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo
        </button>
      `;

      const colorDot = colEl.querySelector('.column-color-indicator');
      colorDot.addEventListener('click', () => {
        const currentIdx = STAGE_COLORS.indexOf(stage.color);
        const nextIdx = (currentIdx + 1) % STAGE_COLORS.length;
        stage.color = STAGE_COLORS[nextIdx];
        odooClient.persistStages();
        this.renderBoardView();
      });

      const moveLeftBtn = colEl.querySelector('.move-col-left');
      const moveRightBtn = colEl.querySelector('.move-col-right');

      if (moveLeftBtn) {
        moveLeftBtn.addEventListener('click', () => {
          const temp = this.stages[idx];
          this.stages[idx] = this.stages[idx - 1];
          this.stages[idx - 1] = temp;
          odooClient.persistStages();
          this.renderBoardView();
        });
      }

      if (moveRightBtn) {
        moveRightBtn.addEventListener('click', () => {
          const temp = this.stages[idx];
          this.stages[idx] = this.stages[idx + 1];
          this.stages[idx + 1] = temp;
          odooClient.persistStages();
          this.renderBoardView();
        });
      }

      const deleteColBtn = colEl.querySelector('.column-delete-btn');
      deleteColBtn.addEventListener('click', () => {
        if (this.stages.length <= 1) {
          alert('Debe haber al menos una columna en el tablero.');
          return;
        }

        const stageToBackup = JSON.parse(JSON.stringify(stage));
        const originalIndex = idx;
        const affectedTasks = this.tasks.filter(t => {
          const tStageId = Array.isArray(t.stage_id) ? t.stage_id[0] : t.stage_id;
          return Number(tStageId) === Number(stage.id);
        }).map(t => ({ task: t, origStageId: t.stage_id }));

        const targetStage = this.stages.find(s => Number(s.id) !== Number(stage.id));

        this.tasks.forEach(t => {
          const currentStageId = Array.isArray(t.stage_id) ? t.stage_id[0] : t.stage_id;
          if (Number(currentStageId) === Number(stage.id)) {
            t.stage_id = [targetStage.id, targetStage.name];
          }
        });

        // Se muta en su lugar: this.stages es la MISMA referencia que
        // odooClient.demoStages[proyecto]. Reasignarla con filter() rompía el
        // vínculo y el borrado no llegaba a guardarse.
        this.stages.splice(originalIndex, 1);

        this.pushUndoAction(`Columna "${stage.name}" eliminada`, () => {
          this.stages.splice(originalIndex, 0, stageToBackup);
          affectedTasks.forEach(item => {
            item.task.stage_id = item.origStageId;
          });
          odooClient.persistStages();
        });

        odooClient.persistStages();
        odooClient.persistDemo();
        this.renderBoardView();
      });

      const colTitleEl = colEl.querySelector('.column-title');
      colTitleEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentTitle = stage.name;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'inline-title-input';
        input.value = currentTitle;
        colTitleEl.replaceWith(input);
        input.focus();

        const saveColName = () => {
          const newName = input.value.trim();
          if (newName && newName !== currentTitle) {
            stage.name = newName;
            // El nombre de la etapa está denormalizado en cada tarea.
            this.tasks.forEach(t => {
              const tStageId = Array.isArray(t.stage_id) ? t.stage_id[0] : t.stage_id;
              if (Number(tStageId) === Number(stage.id)) t.stage_id = [Number(stage.id), newName];
            });
            odooClient.persistStages();
            odooClient.persistDemo();
          }
          this.renderBoardView();
        };

        input.addEventListener('blur', saveColName);
        input.addEventListener('keydown', (evt) => {
          if (evt.key === 'Enter') saveColName();
        });
      });

      const cardsContainer = colEl.querySelector('.cards-container');

      stageTasks.forEach(task => {
        const cardEl = this.createCardElement(task);
        cardsContainer.appendChild(cardEl);
      });

      const quickAddBtn = colEl.querySelector('.quick-add-btn');
      const addIconBtn = colEl.querySelector('.add-card-icon-btn');
      const handleQuickAdd = () => this.promptNewCard(stage.id, stage.name, colEl);
      quickAddBtn.addEventListener('click', handleQuickAdd);
      addIconBtn.addEventListener('click', handleQuickAdd);

      this.attachColumnDragListeners(colEl, cardsContainer, stage.id, stage.name);

      this.boardEl.appendChild(colEl);
    });

    // Red de seguridad: si una tarea apunta a una etapa que ya no existe, el
    // bucle de arriba nunca la dibuja y desaparece del tablero en silencio.
    // Se agrupan en una columna aparte desde la que se pueden arrastrar de vuelta.
    const stageIds = new Set(this.stages.map(s => Number(s.id)));
    const orphanTasks = filteredTasks.filter(t => {
      const tStageId = Array.isArray(t.stage_id) ? t.stage_id[0] : t.stage_id;
      return !stageIds.has(Number(tStageId));
    });

    if (orphanTasks.length > 0) {
      const orphanCol = document.createElement('div');
      orphanCol.className = 'kanban-column';
      orphanCol.innerHTML = `
        <div class="column-header">
          <div class="column-title-group">
            <span class="column-color-indicator" style="background-color: var(--column-pink);"></span>
            <span class="column-title" title="Estas tarjetas quedaron sin columna">⚠️ Sin etapa</span>
            <span class="column-count">${orphanTasks.length}</span>
          </div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); padding:0 4px 8px;">
          Su columna original ya no existe. Arrástralas a la columna que corresponda.
        </div>
        <div class="cards-container"></div>
      `;

      const orphanContainer = orphanCol.querySelector('.cards-container');
      orphanTasks.forEach(task => orphanContainer.appendChild(this.createCardElement(task)));
      this.boardEl.appendChild(orphanCol);
    }

    const addColBtn = document.createElement('button');
    addColBtn.className = 'add-column-btn';
    addColBtn.innerHTML = `<span>+ Añadir Nueva Columna</span>`;
    addColBtn.addEventListener('click', () => {
      const colName = prompt('Nombre de la nueva columna / etapa:');
      if (colName && colName.trim()) {
        const newStage = {
          id: uid(),
          name: colName.trim(),
          sequence: (this.stages.length + 1) * 10,
          color: 'var(--column-purple)'
        };
        this.stages.push(newStage);
        odooClient.persistStages();
        this.renderBoardView();
      }
    });

    this.boardEl.appendChild(addColBtn);
  }

  renderTableView() {
    this.boardEl.innerHTML = '';
    this.boardEl.className = 'notion-table-view';

    const filteredTasks = this.getFilteredTasks();

    const tableEl = document.createElement('table');
    tableEl.className = 'notion-table';
    tableEl.innerHTML = `
      <thead>
        <tr>
          <th>Nombre de Tarea</th>
          <th>Estado / Etapa</th>
          <th>Progreso</th>
          <th>Prioridad</th>
          <th>Socio Responsable</th>
          <th>Fecha Límite</th>
          <th>Etiquetas</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = tableEl.querySelector('tbody');

    filteredTasks.forEach(t => {
      const stageName = Array.isArray(t.stage_id) ? t.stage_id[1] : 'Sin Etapa';
      const tr = document.createElement('tr');
      const percent = this.calculateProgress(t);

      let priorityText = 'Normal';
      if (Number(t.priority) === 1) priorityText = '★ Alta';
      if (Number(t.priority) === 2) priorityText = '🚨 Urgente Socio';

      let socios = 'Ninguno';
      if (Array.isArray(t.user_ids) && t.user_ids.length > 0) {
        socios = t.user_ids.map(u => u.name).join(', ');
      }

      let tagsText = '';
      if (Array.isArray(t.tag_ids)) {
        tagsText = t.tag_ids.map(tag => `<span class="tag-pill tag-${esc(tag.color || 'blue')}">${esc(tag.name)}</span>`).join(' ');
      }

      tr.innerHTML = `
        <td style="font-weight: 500;">${esc(t.icon || '📄')} ${esc(t.name)}</td>
        <td><span class="status-badge">${esc(stageName)}</span></td>
        <td>
          <div class="card-progress-wrapper" style="width: 100px;">
            <div class="progress-track"><div class="progress-fill ${percent === 100 ? 'complete' : ''}" style="width: ${percent}%;"></div></div>
            <span class="progress-label">${percent}%</span>
          </div>
        </td>
        <td>${priorityText}</td>
        <td>${esc(socios)}</td>
        <td>${esc(t.date_deadline || '-')}</td>
        <td>${tagsText}</td>
      `;

      tr.addEventListener('click', () => this.openDetailModal(t));
      tbody.appendChild(tr);
    });

    this.boardEl.appendChild(tableEl);
  }

  renderGalleryView() {
    this.boardEl.innerHTML = '';
    this.boardEl.className = 'notion-gallery-view';

    const filteredTasks = this.getFilteredTasks();

    filteredTasks.forEach(t => {
      const cardEl = document.createElement('div');
      cardEl.className = 'gallery-card';
      const percent = this.calculateProgress(t);

      const imgHtml = t.cover_image
        ? `<img src="${esc(t.cover_image)}" class="gallery-card-img" alt="Cover" />`
        : `<div class="gallery-card-img" style="display:flex; align-items:center; justify-content:center; color:var(--text-light); font-size:32px;">${esc(t.icon || '📝')}</div>`;

      let tagsHtml = '';
      if (Array.isArray(t.tag_ids) && t.tag_ids.length > 0) {
        tagsHtml = `<div class="card-tags" style="margin-top:8px;">` +
          t.tag_ids.map(tag => `<span class="tag-pill tag-${esc(tag.color || 'blue')}">${esc(tag.name)}</span>`).join('') +
        `</div>`;
      }

      cardEl.innerHTML = `
        ${imgHtml}
        <div class="gallery-card-body">
          <div class="card-title">${esc(t.icon || '')} ${esc(t.name)}</div>
          <div class="card-progress-wrapper">
            <div class="progress-track"><div class="progress-fill ${percent === 100 ? 'complete' : ''}" style="width: ${percent}%;"></div></div>
            <span class="progress-label">${percent}%</span>
          </div>
          ${tagsHtml}
        </div>
      `;

      cardEl.addEventListener('click', () => this.openDetailModal(t));
      this.boardEl.appendChild(cardEl);
    });
  }

  createCardElement(task) {
    const cardEl = document.createElement('div');
    cardEl.className = 'notion-card';
    cardEl.draggable = true;
    cardEl.dataset.taskId = task.id;

    let coverHtml = '';
    if (task.cover_image) {
      coverHtml = `<img src="${esc(task.cover_image)}" class="card-cover" alt="Cover Image" />`;
    }

    let tagsHtml = '';
    if (Array.isArray(task.tag_ids) && task.tag_ids.length > 0) {
      tagsHtml = `<div class="card-tags">` +
        task.tag_ids.map(tag => `<span class="tag-pill tag-${esc(tag.color || 'blue')}">${esc(tag.name)}</span>`).join('') +
      `</div>`;
    }

    const percent = this.calculateProgress(task);
    const progressBarHtml = `
      <div class="card-progress-wrapper" title="Progreso de la tarea: ${percent}%">
        <div class="progress-track">
          <div class="progress-fill ${percent === 100 ? 'complete' : ''}" style="width: ${percent}%;"></div>
        </div>
        <span class="progress-label">${percent}%</span>
      </div>
    `;

    let priorityHtml = '';
    if (Number(task.priority) > 0) {
      const stars = Number(task.priority) === 2 ? '🚨 Urgencia' : '★ Alta';
      priorityHtml = `<span class="priority-star" title="Prioridad: ${esc(task.priority)}">${stars}</span>`;
    }

    let partnerBadgesHtml = '';
    if (Array.isArray(task.user_ids) && task.user_ids.length > 0) {
      partnerBadgesHtml = `<div class="user-avatars">` +
        task.user_ids.map(u => {
          const isAbelardo = (u.name || '').toLowerCase().includes('abelardo') || u.role === 'abelardo';
          const isRegina = (u.name || '').toLowerCase().includes('regina') || u.role === 'regina';
          if (isAbelardo) return `<span class="avatar-badge abelardo" title="Abelardo">👨‍💻 Abelardo</span>`;
          if (isRegina) return `<span class="avatar-badge regina" title="Regina">👩‍💼 Regina</span>`;
          return `<span class="avatar-badge both" title="Ambos">👥 Socio</span>`;
        }).join('') +
      `</div>`;
    }

    let subtasksHtml = '';
    if (Array.isArray(task.subtasks) && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(s => s.status === 'done' || s.completed).length;
      subtasksHtml = `<div class="subtasks-pill"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg> ${completed}/${task.subtasks.length}</div>`;
    }

    let attachHtml = '';
    if (Array.isArray(task.attachments) && task.attachments.length > 0) {
      attachHtml = `<div class="subtasks-pill" title="Archivos adjuntos">📎 ${task.attachments.length}</div>`;
    }

    let deadlineHtml = '';
    if (task.date_deadline) {
      deadlineHtml = `<div class="deadline-pill ${isOverdue(task.date_deadline) ? 'overdue' : ''}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${task.date_deadline}</div>`;
    }

    cardEl.innerHTML = `
      ${coverHtml}
      ${tagsHtml}
      <div class="card-title-row">
        <div class="card-title">${esc(task.icon || '')} ${esc(task.name)}</div>
        <span class="edit-title-icon" title="Renombrar tarjeta inline">✏️</span>
      </div>
      ${progressBarHtml}
      <div class="card-meta-footer">
        <div class="meta-group">
          ${priorityHtml}
          ${deadlineHtml}
          ${subtasksHtml}
          ${attachHtml}
        </div>
        ${partnerBadgesHtml}
      </div>
    `;

    const editIcon = cardEl.querySelector('.edit-title-icon');
    const titleTextEl = cardEl.querySelector('.card-title');

    const handleInlineTitleEdit = (e) => {
      e.stopPropagation();
      const currentName = task.name;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'inline-title-input';
      input.value = currentName;
      titleTextEl.replaceWith(input);
      input.focus();

      const saveInlineName = () => {
        const newName = input.value.trim();
        if (newName && newName !== currentName) {
          task.name = newName;
          odooClient.persistDemo();
        }
        this.renderCurrentView();
      };

      input.addEventListener('blur', saveInlineName);
      input.addEventListener('keydown', (evt) => {
        if (evt.key === 'Enter') saveInlineName();
      });
    };

    editIcon.addEventListener('click', handleInlineTitleEdit);

    cardEl.addEventListener('dragstart', (e) => {
      this.draggedTaskId = task.id;
      cardEl.classList.add('dragging');
      e.dataTransfer.setData('text/plain', String(task.id));
      e.dataTransfer.effectAllowed = 'move';
    });

    cardEl.addEventListener('dragend', () => {
      cardEl.classList.remove('dragging');
      this.draggedTaskId = null;
    });

    cardEl.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT' && !e.target.classList.contains('edit-title-icon')) {
        this.openDetailModal(task);
      }
    });

    return cardEl;
  }

  attachColumnDragListeners(colEl, cardsContainer, stageId, stageName) {
    colEl.addEventListener('dragover', (e) => {
      e.preventDefault();
      colEl.classList.add('drag-over');
      e.dataTransfer.dropEffect = 'move';
    });

    colEl.addEventListener('dragleave', (e) => {
      if (!colEl.contains(e.relatedTarget)) {
        colEl.classList.remove('drag-over');
      }
    });

    colEl.addEventListener('drop', async (e) => {
      e.preventDefault();
      colEl.classList.remove('drag-over');

      const taskId = this.draggedTaskId || e.dataTransfer.getData('text/plain');
      if (!taskId) return;

      const task = this.tasks.find(t => String(t.id) === String(taskId));
      if (!task) return;

      const currentStageId = Array.isArray(task.stage_id) ? task.stage_id[0] : task.stage_id;
      if (Number(currentStageId) === Number(stageId)) return;

      task.stage_id = [Number(stageId), stageName];
      odooClient.persistDemo();
      this.renderCurrentView();

      try {
        await odooClient.updateTaskStage(taskId, stageId, stageName);
      } catch (err) {
        console.warn('Error al actualizar estado en Odoo:', err);
      }
    });
  }

  promptNewCard(stageId, stageName, colEl) {
    const existingForm = colEl ? colEl.querySelector('.quick-add-form') : null;
    if (existingForm) {
      existingForm.querySelector('input').focus();
      return;
    }

    const formEl = document.createElement('div');
    formEl.className = 'quick-add-form';
    formEl.innerHTML = `
      <input type="text" class="quick-add-input" placeholder="Nombre de la tarjeta..." />
      <div style="display: flex; gap: 6px;">
        <button class="btn btn-primary btn-sm save-quick-add" style="padding: 4px 10px; font-size: 12px;">Añadir</button>
        <button class="btn btn-sm cancel-quick-add" style="padding: 4px 10px; font-size: 12px;">Cancelar</button>
      </div>
    `;

    const cardsContainer = colEl ? colEl.querySelector('.cards-container') : null;
    if (cardsContainer) cardsContainer.appendChild(formEl);

    const input = formEl.querySelector('input');
    if (input) input.focus();

    let submitting = false;
    const submit = async () => {
      if (submitting) return; // Evita doble alta con doble Enter durante el await
      const title = input.value.trim();
      if (title) {
        submitting = true;
        try {
          const newTask = await odooClient.createTask(title, stageId, stageName, this.currentProjectId);
          newTask.projectId = this.currentProjectId;
          newTask.icon = '📄';
          newTask.subtasks = [];
          newTask.attachments = [];

          // En modo demo, createTask() ya insertó la tarea en odooClient.demoTasks,
          // que es el MISMO arreglo que this.tasks. Insertarla de nuevo la duplicaba.
          // En modo Odoo real no la inserta, así que aquí sigue haciendo falta.
          if (!this.tasks.some(t => t === newTask || String(t.id) === String(newTask.id))) {
            this.tasks.push(newTask);
          }

          odooClient.persistDemo();
          this.renderCurrentView();
        } catch (err) {
          alert('Error creando tarea: ' + err.message);
        } finally {
          submitting = false;
        }
      } else {
        formEl.remove();
      }
    };

    const saveBtn = formEl.querySelector('.save-quick-add');
    const cancelBtn = formEl.querySelector('.cancel-quick-add');

    if (saveBtn) saveBtn.addEventListener('click', submit);
    if (cancelBtn) cancelBtn.addEventListener('click', () => formEl.remove());
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
        if (e.key === 'Escape') formEl.remove();
      });
    }
  }

  openConfigModal() {
    this.demoToggleEl.checked = odooClient.isDemoMode();
    document.getElementById('odoo-fields').style.display = odooClient.isDemoMode() ? 'none' : 'flex';

    document.getElementById('odoo-url').value = odooClient.config.url;
    document.getElementById('odoo-db').value = odooClient.config.db;
    document.getElementById('odoo-user').value = odooClient.config.username;
    document.getElementById('odoo-pass').value = odooClient.config.password;
    document.getElementById('odoo-model').value = odooClient.config.model;

    this.configModalEl.classList.add('active');
  }

  closeConfigModal() {
    this.configModalEl.classList.remove('active');
  }

  async handleConfigSubmit(e) {
    e.preventDefault();
    const isDemo = this.demoToggleEl.checked;

    odooClient.setDemoMode(isDemo);
    if (!isDemo) {
      odooClient.saveConfig({
        url: document.getElementById('odoo-url').value.trim(),
        db: document.getElementById('odoo-db').value.trim(),
        username: document.getElementById('odoo-user').value.trim(),
        password: document.getElementById('odoo-pass').value.trim(),
        model: document.getElementById('odoo-model').value.trim()
      });

      try {
        await odooClient.authenticate();
        alert('¡Conexión exitosa con Odoo!');
      } catch (err) {
        alert('Error conectando a Odoo: ' + err.message);
        return;
      }
    }

    this.closeConfigModal();
    this.updateStatusBadge();
    await this.loadData();
  }

  async handleFileUpload(file, task) {
    // Se avisa ANTES de leer el archivo: en base64 crece ~33%, así que pasado
    // este tamaño el servidor lo rechazaría con un error poco claro.
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      throw new Error(
        `"${file.name}" pesa ${mb} MB y el máximo son ${MAX_UPLOAD_MB} MB. ` +
        `Para videos grandes, súbelos a Drive o YouTube y pega el enlace en la minuta.`
      );
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: reader.result
            })
          });

          // Si el servidor responde con HTML (proxy, 413, 502...), res.json()
          // lanzaría un error críptico; se traduce a algo legible.
          let data;
          try {
            data = await res.json();
          } catch (parseErr) {
            throw new Error(`El servidor respondió ${res.status} ${res.statusText || ''}`.trim());
          }

          if (data.success) {
            if (!Array.isArray(task.attachments)) task.attachments = [];
            task.attachments.push({
              id: uid(),
              name: file.name,
              url: data.url,
              isImage: file.type.startsWith('image/'),
              isVideo: file.type.startsWith('video/')
            });

            if (file.type.startsWith('image/') && !task.cover_image) {
              task.cover_image = data.url;
            }

            odooClient.persistDemo();
            resolve(data.url);
          } else {
            reject(new Error(data.error || 'Error subiendo archivo'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }

  // Vuelca al objeto `task` lo que el usuario tiene escrito en el modal en este
  // momento. Sin esto, cualquier re-render (agregar bloque, subir archivo, mover
  // subtarea...) reconstruye el modal desde `task` y descarta lo no guardado.
  captureDetailForm(task) {
    if (!task || !this.detailModalBodyEl) return;
    const body = this.detailModalBodyEl;
    const valueOf = (id) => {
      const el = body.querySelector(`#${id}`);
      return el ? el.value : null;
    };

    const newName = valueOf('detail-task-name');
    if (newName !== null && newName.trim()) task.name = newName.trim();

    const newIcon = valueOf('detail-task-icon');
    if (newIcon !== null) task.icon = newIcon.trim() || '📄';

    const newPriority = valueOf('detail-task-priority');
    if (newPriority !== null) task.priority = newPriority;

    const newDeadline = valueOf('detail-task-deadline');
    if (newDeadline !== null) task.date_deadline = newDeadline;

    const newDesc = valueOf('detail-task-desc');
    if (newDesc !== null) task.description = newDesc;

    const newCover = valueOf('detail-task-cover');
    if (newCover !== null) task.cover_image = newCover.trim();

    const stageSel = body.querySelector('#detail-task-stage');
    if (stageSel && stageSel.value) {
      const stageObj = this.stages.find(s => Number(s.id) === Number(stageSel.value));
      const fallbackName = Array.isArray(task.stage_id) ? task.stage_id[1] : 'Actualizado';
      task.stage_id = [Number(stageSel.value), stageObj ? stageObj.name : fallbackName];
    }

    const chkAbelardo = body.querySelector('#chk-abelardo');
    const chkRegina = body.querySelector('#chk-regina');
    if (chkAbelardo || chkRegina) {
      task.user_ids = [];
      if (chkAbelardo && chkAbelardo.checked) task.user_ids.push({ id: 1, name: 'Abelardo', role: 'abelardo' });
      if (chkRegina && chkRegina.checked) task.user_ids.push({ id: 2, name: 'Regina', role: 'regina' });
    }

    if (body.querySelector('.tag-chk')) {
      task.tag_ids = [];
      body.querySelectorAll('.tag-chk:checked').forEach(chk => {
        task.tag_ids.push({
          id: Number(chk.dataset.tagId),
          name: chk.dataset.tagName,
          color: chk.dataset.tagColor
        });
      });
    }
  }

  // Re-dibuja el modal conservando lo que el usuario tenga escrito.
  // `mutate` se ejecuta después de capturar el formulario, para que los cambios
  // hechos por el handler (portada, adjuntos, bloques...) no se pisen.
  refreshDetailModal(task, mutate) {
    this.captureDetailForm(task);
    if (typeof mutate === 'function') mutate();
    odooClient.persistDemo();
    this.openDetailModal(task);
  }

  openDetailModal(task) {
    // La etapa realmente persistida se recuerda solo mientras el modal siga
    // abierto sobre la misma tarea, para no re-enviar el cambio a Odoo en cada
    // re-render interno.
    if (this._detailTaskId !== task.id) {
      this._detailTaskId = task.id;
      this._detailPersistedStageId = Array.isArray(task.stage_id) ? task.stage_id[0] : task.stage_id;
    }
    this._detailTask = task;

    const stageOptions = this.stages.map(s => {
      const currentStageId = Array.isArray(task.stage_id) ? task.stage_id[0] : task.stage_id;
      const selected = Number(s.id) === Number(currentStageId) ? 'selected' : '';
      return `<option value="${s.id}" ${selected}>${esc(s.name)}</option>`;
    }).join('');

    const isAbelardo = Array.isArray(task.user_ids) && task.user_ids.some(u => (u.name || '').includes('Abelardo'));
    const isRegina = Array.isArray(task.user_ids) && task.user_ids.some(u => (u.name || '').includes('Regina'));

    if (!Array.isArray(task.subtasks)) task.subtasks = [];
    if (!Array.isArray(task.attachments)) task.attachments = [];
    if (!Array.isArray(task.tag_ids)) task.tag_ids = [];

    const percent = this.calculateProgress(task);

    const todoSubs = task.subtasks.filter(s => !s.status || s.status === 'todo');
    const inProgressSubs = task.subtasks.filter(s => s.status === 'in_progress');
    const doneSubs = task.subtasks.filter(s => s.status === 'done' || s.completed);

    const renderSubCards = (items) => items.map((st) => `
      <div class="sub-kanban-card" draggable="true" data-sub-id="${st.id}">
        <span class="sub-card-text" title="Haz clic para renombrar subtarea">${esc(st.text)}</span>
        <button class="delete-sub-btn" data-sub-id="${st.id}" title="Eliminar subtarea (esquina superior derecha)">🗑️</button>
      </div>
    `).join('');

    // Dynamic Tag Management
    const availableTags = getAvailableTags();
    const tagsHtml = availableTags.map(tag => {
      const checked = task.tag_ids.some(t => Number(t.id) === Number(tag.id) || t.name === tag.name) ? 'checked' : '';
      return `
        <div style="display: inline-flex; align-items: center; gap: 4px; background: var(--bg-subtle); padding: 4px 8px; border-radius: 14px; border: 1px solid var(--border-light);">
          <label style="cursor: pointer; font-size: 12px; display: flex; align-items: center; gap: 4px;">
            <input type="checkbox" class="tag-chk" data-tag-id="${tag.id}" data-tag-name="${esc(tag.name)}" data-tag-color="${esc(tag.color)}" ${checked} />
            <span class="tag-pill tag-${esc(tag.color || 'blue')}">${esc(tag.name)}</span>
          </label>
          <button type="button" class="edit-tag-btn icon-btn-subtle" data-tag-id="${tag.id}" title="Editar etiqueta" style="font-size: 10px; padding: 0 2px;">✏️</button>
          <button type="button" class="delete-tag-btn icon-btn-subtle" data-tag-id="${tag.id}" title="Eliminar etiqueta" style="font-size: 10px; padding: 0 2px;">🗑️</button>
        </div>
      `;
    }).join(' ');

    const renderAttachments = Array.isArray(task.attachments) ? task.attachments.map(att => `
      <div class="attachment-card">
        ${att.isImage
          ? `<img src="${esc(att.url)}" class="attachment-img-preview" alt="Attachment" />`
          : att.isVideo
            ? `<video src="${esc(att.url)}" class="attachment-img-preview" controls preload="metadata"></video>`
            : `<div class="attachment-doc-badge">📄 ${esc(att.name)}</div>`
        }
        <div class="attachment-footer">
          <a href="${esc(att.url)}" target="_blank" style="color: var(--text-main); text-decoration:none;">Abrir</a>
          ${att.isImage ? `<button type="button" class="set-cover-btn" data-url="${esc(att.url)}">Usar Portada</button>` : ''}
        </div>
      </div>
    `).join('') : '';

    if (!Array.isArray(task.blocks)) task.blocks = [];

    const renderTaskBlocks = (blocks) => {
      if (!blocks || blocks.length === 0) {
        return `<div style="font-size:12px; color:var(--text-muted); font-style:italic; text-align:center; padding:10px;">Aún no has agregado bloques a esta tarea. Usa los botones de arriba para añadir notas, listas, cuadrículas o carruseles.</div>`;
      }

      return blocks.map((blk, idx) => {
        if (blk.type === 'callout') {
          return `
            <div class="notion-block-card" data-block-id="${blk.id}">
              <div class="notion-block-header">
                <span>💡 Callout / Alerta Destacada</span>
                <div>
                  <button type="button" class="move-block-up icon-btn-subtle" data-idx="${idx}">▲</button>
                  <button type="button" class="move-block-down icon-btn-subtle" data-idx="${idx}">▼</button>
                  <button type="button" class="delete-block-btn icon-btn-subtle" data-block-id="${blk.id}" style="color:#ef4444;">🗑️</button>
                </div>
              </div>
              <div class="notion-callout">
                <input type="text" class="block-callout-icon" data-block-id="${blk.id}" value="${esc(blk.icon || '💡')}" style="width:30px; font-size:18px; text-align:center; border:none; background:none;" />
                <div style="flex:1; display:flex; flex-direction:column; gap:4px;">
                  <input type="text" class="block-callout-title form-control" data-block-id="${blk.id}" value="${esc(blk.title)}" placeholder="Título del destacado..." style="font-weight:700; font-size:13px;" />
                  <textarea class="block-callout-text form-control" data-block-id="${blk.id}" rows="2" placeholder="Detalle o nota destacada...">${esc(blk.text)}</textarea>
                </div>
              </div>
            </div>
          `;
        }

        if (blk.type === 'table') {
          const rows = Array.isArray(blk.rows) ? blk.rows : [];
          return `
            <div class="notion-block-card" data-block-id="${blk.id}">
              <div class="notion-block-header">
                <span>📊 Cuadrícula / Tabla Estilo Notion</span>
                <div>
                  <button type="button" class="move-block-up icon-btn-subtle" data-idx="${idx}">▲</button>
                  <button type="button" class="move-block-down icon-btn-subtle" data-idx="${idx}">▼</button>
                  <button type="button" class="delete-block-btn icon-btn-subtle" data-block-id="${blk.id}" style="color:#ef4444;">🗑️</button>
                </div>
              </div>
              <input type="text" class="block-table-title form-control" data-block-id="${blk.id}" value="${esc(blk.title || 'Tabla de Métricas')}" style="font-weight:700; font-size:13px;" />
              <table class="notion-grid-table">
                <thead>
                  <tr>
                    <th>Métrica / Ítem</th>
                    <th>Meta</th>
                    <th>Realista</th>
                    <th>Desafiante</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows.map((r, rIdx) => `
                    <tr>
                      <td><input type="text" class="grid-cell-input form-control" data-block-id="${blk.id}" data-row="${rIdx}" data-col="0" value="${esc(r[0])}" style="font-size:12px;" /></td>
                      <td><input type="text" class="grid-cell-input form-control" data-block-id="${blk.id}" data-row="${rIdx}" data-col="1" value="${esc(r[1])}" style="font-size:12px;" /></td>
                      <td><input type="text" class="grid-cell-input form-control" data-block-id="${blk.id}" data-row="${rIdx}" data-col="2" value="${esc(r[2])}" style="font-size:12px;" /></td>
                      <td><input type="text" class="grid-cell-input form-control" data-block-id="${blk.id}" data-row="${rIdx}" data-col="3" value="${esc(r[3])}" style="font-size:12px;" /></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <button type="button" class="btn btn-sm add-table-row-btn" data-block-id="${blk.id}" style="font-size:11px; align-self:flex-start; margin-top:4px;">+ Añadir Fila</button>
            </div>
          `;
        }

        if (blk.type === 'carousel') {
          const images = Array.isArray(task.attachments) ? task.attachments.filter(a => a.isImage) : [];
          return `
            <div class="notion-block-card" data-block-id="${blk.id}">
              <div class="notion-block-header">
                <span>🎠 Carrusel de Imágenes & Galería</span>
                <div>
                  <button type="button" class="move-block-up icon-btn-subtle" data-idx="${idx}">▲</button>
                  <button type="button" class="move-block-down icon-btn-subtle" data-idx="${idx}">▼</button>
                  <button type="button" class="delete-block-btn icon-btn-subtle" data-block-id="${blk.id}" style="color:#ef4444;">🗑️</button>
                </div>
              </div>
              ${images.length > 0 ? `
                <div class="notion-carousel-slider">
                  ${images.map(img => `
                    <div style="display:flex; flex-direction:column; gap:2px;">
                      <img src="${esc(img.url)}" class="carousel-slide-item" alt="Slide" />
                      <span style="font-size:10px; color:var(--text-muted); width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${esc(img.name)}</span>
                    </div>
                  `).join('')}
                </div>
              ` : `<div style="font-size:11px; color:var(--text-muted);">Adjunta imágenes a la tarjeta para que se proyecten automáticamente en el carrusel.</div>`}
            </div>
          `;
        }

        if (blk.type === 'note') {
          return `
            <div class="notion-block-card" data-block-id="${blk.id}">
              <div class="notion-block-header">
                <span>📝 Bloque de Nota / Texto Libre</span>
                <div>
                  <button type="button" class="move-block-up icon-btn-subtle" data-idx="${idx}">▲</button>
                  <button type="button" class="move-block-down icon-btn-subtle" data-idx="${idx}">▼</button>
                  <button type="button" class="delete-block-btn icon-btn-subtle" data-block-id="${blk.id}" style="color:#ef4444;">🗑️</button>
                </div>
              </div>
              <input type="text" class="block-note-title form-control" data-block-id="${blk.id}" value="${esc(blk.title)}" placeholder="Título del bloque de notas..." style="font-weight:600; font-size:13px;" />
              <textarea class="block-note-content form-control" data-block-id="${blk.id}" rows="3" placeholder="Escribe aquí notas adicionales, listas o minuta..." style="font-size:12px;">${esc(blk.text)}</textarea>
            </div>
          `;
        }

        return '';
      }).join('');
    };

    const hasCover = Boolean(task.cover_image);
    const coverBannerHtml = hasCover ? `
      <div class="modal-cover-banner" style="background-image: url('${esc(task.cover_image)}');">
        <div class="cover-banner-overlay">
          <button type="button" id="upload-cover-direct-btn" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 11px;">📷 Cambiar Portada</button>
          <button type="button" id="remove-cover-btn" class="btn btn-sm btn-danger" style="padding: 4px 10px; font-size: 11px;">🗑️ Quitar Portada</button>
        </div>
      </div>
    ` : '';

    const imageAttachments = Array.isArray(task.attachments) ? task.attachments.filter(att => att.isImage) : [];
    let quickPickerHtml = '';
    if (imageAttachments.length > 0) {
      quickPickerHtml = `
        <div style="margin-top: 8px;">
          <span style="font-size: 11px; font-weight: 600; color: var(--text-muted);">Elegir de imágenes adjuntas:</span>
          <div class="cover-quick-picker">
            ${imageAttachments.map(att => `
              <img src="${esc(att.url)}" class="cover-thumb-option ${task.cover_image === att.url ? 'active' : ''}" data-url="${esc(att.url)}" title="Establecer ${esc(att.name)} como portada" />
            `).join('')}
          </div>
        </div>
      `;
    }

    // Emoji Presets Bar
    const emojiPresetsHtml = EMOJI_PRESETS.map(e => `<button type="button" class="emoji-preset-btn" data-emoji="${e}" style="background:none; border:none; font-size:16px; cursor:pointer; padding:2px;">${e}</button>`).join('');

    this.detailModalBodyEl.innerHTML = `
      ${coverBannerHtml}

      <div style="display: flex; gap: 8px; align-items: flex-end;">
        <div class="form-group" style="width: 70px;">
          <label>Icono</label>
          <input type="text" id="detail-task-icon" class="form-control" value="${esc(task.icon || '📄')}" style="text-align: center; font-size: 18px;" />
        </div>
        <div class="form-group" style="flex: 1;">
          <label>Título de la Tarea / Proyecto</label>
          <input type="text" id="detail-task-name" class="form-control" value="${esc(task.name)}" style="font-size: 16px; font-weight: 600;" />
        </div>
      </div>

      <!-- Emoji Presets bar -->
      <div style="display:flex; gap: 4px; margin-top: 4px; flex-wrap: wrap; align-items:center;">
        <span style="font-size:11px; color:var(--text-muted);">Iconos rápidos:</span>
        ${emojiPresetsHtml}
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 2px;">
          <label>Progreso General</label>
          <span style="font-size: 12px; font-weight: 700; color: #10b981;">${percent}% Completado</span>
        </div>
        <div class="progress-track" style="height: 10px;">
          <div class="progress-fill ${percent === 100 ? 'complete' : ''}" style="width: ${percent}%;"></div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
        <div class="form-group">
          <label>Etapa Principal</label>
          <select id="detail-task-stage" class="form-control">
            ${stageOptions}
          </select>
        </div>
        <div class="form-group">
          <label>Prioridad Socio</label>
          <select id="detail-task-priority" class="form-control">
            <option value="0" ${task.priority === '0' ? 'selected' : ''}>Normal ⭐</option>
            <option value="1" ${task.priority === '1' ? 'selected' : ''}>Alta ⭐⭐</option>
            <option value="2" ${task.priority === '2' ? 'selected' : ''}>Urgente Socio 🚨</option>
          </select>
        </div>
        <div class="form-group">
          <label>Fecha Límite</label>
          <input type="date" id="detail-task-deadline" class="form-control" value="${task.date_deadline || ''}" />
        </div>
      </div>

      <div class="form-group">
        <label>Socio Responsable</label>
        <div style="display: flex; gap: 12px; margin-top: 4px;">
          <label style="cursor: pointer; font-size: 13px;"><input type="checkbox" id="chk-abelardo" ${isAbelardo ? 'checked' : ''} /> 👨‍💻 Abelardo</label>
          <label style="cursor: pointer; font-size: 13px;"><input type="checkbox" id="chk-regina" ${isRegina ? 'checked' : ''} /> 👩‍💼 Regina</label>
        </div>
      </div>

      <!-- Editable Tags Management -->
      <div class="form-group">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
          <label>🏷️ Etiquetas / Categorías</label>
          <button type="button" id="add-custom-tag-btn" class="btn btn-sm" style="font-size: 11px; padding: 2px 8px;">+ Crear Nueva Etiqueta</button>
        </div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${tagsHtml}
        </div>
      </div>

      <div class="form-group" style="margin-top: 10px; background: var(--bg-subtle); padding: 12px; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <label style="display: flex; align-items: center; justify-content: space-between;">
          <span>🖼️ Imagen de Portada</span>
          ${hasCover ? `<span style="font-size: 11px; color: #10b981;">✓ Portada Activa</span>` : ''}
        </label>
        
        <div class="cover-dropzone" id="cover-dropzone">
          <input type="file" id="cover-file-input" style="display:none;" accept="image/*" />
          <div style="font-size: 13px; font-weight: 500; color: var(--text-main);">
            📷 Subir nueva imagen de portada directamente
          </div>
          <div style="font-size: 11px; color: var(--text-muted);">
            Haz clic aquí o selecciona una imagen (JPG, PNG, WebP)
          </div>
        </div>

        ${quickPickerHtml}

        <div style="margin-top: 8px;">
          <input type="url" id="detail-task-cover" class="form-control" value="${esc(task.cover_image)}" placeholder="O pega un enlace directo URL (https://...)" style="font-size: 12px;" />
        </div>
      </div>

      <div class="sub-kanban-container">
        <div class="sub-kanban-title">
          <span>📊 Sub-Kanban de Hitos / Subtareas</span>
          <span style="font-weight:normal; font-size:11px;">🖐️ Arrastra las tarjetas entre columnas</span>
        </div>
        
        <div class="sub-kanban-board">
          <div class="sub-kanban-col" data-sub-col="todo">
            <div class="sub-kanban-col-header">
              <span>📌 Por Hacer</span>
              <span>${todoSubs.length}</span>
            </div>
            ${renderSubCards(todoSubs)}
          </div>

          <div class="sub-kanban-col" data-sub-col="in_progress">
            <div class="sub-kanban-col-header">
              <span>⚡ En Proceso</span>
              <span>${inProgressSubs.length}</span>
            </div>
            ${renderSubCards(inProgressSubs)}
          </div>

          <div class="sub-kanban-col" data-sub-col="done">
            <div class="sub-kanban-col-header">
              <span>✅ Completado</span>
              <span>${doneSubs.length}</span>
            </div>
            ${renderSubCards(doneSubs)}
          </div>
        </div>

        <div style="display: flex; gap: 6px; margin-top: 8px;">
          <input type="text" id="new-subtask-input" class="form-control" placeholder="+ Añadir subtarea al Sub-Kanban..." style="font-size: 12px;" />
          <button id="add-sub-card-btn" class="btn btn-sm btn-primary">Añadir</button>
        </div>
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <label>📎 Archivos & Imágenes Adjuntas</label>
        <div class="upload-dropzone" id="file-dropzone">
          <input type="file" id="file-input" style="display:none;" multiple />
          <div style="font-size: 13px; font-weight: 500; color: var(--text-main);">
            📁 Haz clic o arrastra archivos aquí para adjuntar a la tarea
          </div>
          <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
            Soporta imágenes (PNG, JPG, WebP), PDFs y documentos.
          </div>
        </div>

        <div class="attachments-grid" id="attachments-grid">
          ${renderAttachments}
        </div>
      </div>

      <!-- Notion Interactive Block Content Builder -->
      <div class="notion-block-container">
        <div class="sub-kanban-title" style="margin-bottom: 4px;">
          <span>🧩 Bloques de Contenido Estilo Notion</span>
          <span style="font-weight:normal; font-size:11px;">Agrega notas, cuadrículas, carruseles y alertas</span>
        </div>

        <div class="notion-builder-toolbar">
          <button type="button" class="btn btn-sm add-block-btn" data-type="callout" style="font-size:11px;">💡 + Callout Destacado</button>
          <button type="button" class="btn btn-sm add-block-btn" data-type="table" style="font-size:11px;">📊 + Cuadrícula / Tabla</button>
          <button type="button" class="btn btn-sm add-block-btn" data-type="carousel" style="font-size:11px;">🎠 + Carrusel de Imágenes</button>
          <button type="button" class="btn btn-sm add-block-btn" data-type="note" style="font-size:11px;">📝 + Nota de Texto</button>
        </div>

        <div id="notion-blocks-list" style="display:flex; flex-direction:column; gap:10px;">
          ${renderTaskBlocks(task.blocks)}
        </div>
      </div>

      <div class="form-group" style="margin-top:10px;">
        <label>Contenido / Minuta de la Bitácora</label>
        <textarea id="detail-task-desc" class="form-control" rows="5" style="resize: vertical; font-family: monospace; font-size: 12px;">${esc(task.description)}</textarea>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
        <button id="delete-task-btn" class="btn btn-danger">🗑️ Eliminar Tarea</button>
        <button id="save-detail-btn" class="btn btn-primary">Guardar Cambios</button>
      </div>
    `;

    // Emoji Presets Click Handler
    this.detailModalBodyEl.querySelectorAll('.emoji-preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const emoji = e.target.dataset.emoji;
        document.getElementById('detail-task-icon').value = emoji;
      });
    });

    // Tag Manager Event Handlers
    const addTagBtn = document.getElementById('add-custom-tag-btn');
    if (addTagBtn) {
      addTagBtn.addEventListener('click', () => {
        const tagName = prompt('Nombre de la nueva etiqueta:');
        if (tagName && tagName.trim()) {
          const colorOpt = prompt('Color de la etiqueta (amber, purple, blue, emerald, red, pink, gray, indigo):', 'blue');
          const validColors = ['amber', 'purple', 'blue', 'emerald', 'red', 'pink', 'gray', 'indigo'];
          const finalColor = validColors.includes((colorOpt || '').toLowerCase().trim()) ? colorOpt.toLowerCase().trim() : 'blue';
          
          const tags = getAvailableTags();
          tags.push({ id: uid(), name: tagName.trim(), color: finalColor });
          saveAvailableTags(tags);
          this.refreshDetailModal(task);
        }
      });
    }

    this.detailModalBodyEl.querySelectorAll('.edit-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagId = Number(e.target.dataset.tagId);
        const tags = getAvailableTags();
        const targetTag = tags.find(t => Number(t.id) === tagId);
        if (!targetTag) return;

        const newName = prompt('Editar nombre de la etiqueta:', targetTag.name);
        if (newName && newName.trim()) {
          const newColor = prompt('Editar color de la etiqueta (amber, purple, blue, emerald, red, pink, gray, indigo):', targetTag.color);
          targetTag.name = newName.trim();
          if (newColor && newColor.trim()) targetTag.color = newColor.trim();
          saveAvailableTags(tags);
          this.refreshDetailModal(task);
        }
      });
    });

    this.detailModalBodyEl.querySelectorAll('.delete-tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tagId = Number(e.target.dataset.tagId);
        let tags = getAvailableTags();
        tags = tags.filter(t => Number(t.id) !== tagId);
        saveAvailableTags(tags);
        this.refreshDetailModal(task, () => {
          task.tag_ids = task.tag_ids.filter(t => Number(t.id) !== tagId);
        });
      });
    });

    // Sub-Kanban Drag and Drop
    this.detailModalBodyEl.querySelectorAll('.sub-kanban-card').forEach(subCard => {
      subCard.addEventListener('dragstart', (e) => {
        e.stopPropagation();
        this.draggedSubtaskId = subCard.dataset.subId;
        subCard.style.opacity = '0.4';
        e.dataTransfer.setData('text/plain', String(subCard.dataset.subId));
        e.dataTransfer.effectAllowed = 'move';
      });

      subCard.addEventListener('dragend', () => {
        subCard.style.opacity = '1';
        this.draggedSubtaskId = null;
      });

      const subTextSpan = subCard.querySelector('.sub-card-text');
      if (subTextSpan) {
        subTextSpan.addEventListener('click', (e) => {
          e.stopPropagation();
          const subId = subCard.dataset.subId;
          const subObj = task.subtasks.find(s => String(s.id) === String(subId));
          if (!subObj) return;

          const input = document.createElement('input');
          input.type = 'text';
          input.className = 'inline-title-input';
          input.value = subObj.text;
          subTextSpan.replaceWith(input);
          input.focus();

          const saveSubText = () => {
            const newText = input.value.trim();
            this.refreshDetailModal(task, () => {
              if (newText) subObj.text = newText;
            });
          };

          input.addEventListener('blur', saveSubText);
          input.addEventListener('keydown', (evt) => {
            if (evt.key === 'Enter') saveSubText();
          });
        });
      }
    });

    this.detailModalBodyEl.querySelectorAll('.sub-kanban-col').forEach(subCol => {
      subCol.addEventListener('dragover', (e) => {
        e.preventDefault();
        subCol.style.backgroundColor = 'var(--column-blue)';
        e.dataTransfer.dropEffect = 'move';
      });

      subCol.addEventListener('dragleave', () => {
        subCol.style.backgroundColor = 'var(--bg-card)';
      });

      subCol.addEventListener('drop', (e) => {
        e.preventDefault();
        subCol.style.backgroundColor = 'var(--bg-card)';
        const targetStatus = subCol.dataset.subCol;
        if (!targetStatus || !this.draggedSubtaskId) return;

        const sub = task.subtasks.find(s => String(s.id) === String(this.draggedSubtaskId));
        if (sub) {
          this.refreshDetailModal(task, () => {
            sub.status = targetStatus;
            sub.completed = (targetStatus === 'done');
          });
        }
      });
    });

    const dropzone = document.getElementById('file-dropzone');
    const fileInput = document.getElementById('file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
          try {
            await this.handleFileUpload(file, task);
          } catch (err) {
            alert('Error subiendo archivo: ' + err.message);
          }
        }
        this.refreshDetailModal(task);
      });
    }

    const coverDropzone = document.getElementById('cover-dropzone');
    const coverFileInput = document.getElementById('cover-file-input');
    const uploadCoverBtn = document.getElementById('upload-cover-direct-btn');
    const removeCoverBtn = document.getElementById('remove-cover-btn');

    const triggerCoverUpload = () => coverFileInput && coverFileInput.click();
    if (coverDropzone) coverDropzone.addEventListener('click', triggerCoverUpload);
    if (uploadCoverBtn) uploadCoverBtn.addEventListener('click', triggerCoverUpload);

    if (coverFileInput) {
      coverFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
          try {
            const url = await this.handleFileUpload(file, task);
            this.refreshDetailModal(task, () => { task.cover_image = url; });
          } catch (err) {
            alert('Error subiendo imagen de portada: ' + err.message);
          }
        }
      });
    }

    if (removeCoverBtn) {
      removeCoverBtn.addEventListener('click', () => {
        this.refreshDetailModal(task, () => { task.cover_image = ''; });
      });
    }

    this.detailModalBodyEl.querySelectorAll('.cover-thumb-option').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const url = e.target.dataset.url;
        this.refreshDetailModal(task, () => { task.cover_image = url; });
      });
    });

    this.detailModalBodyEl.querySelectorAll('.set-cover-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const coverUrl = e.target.dataset.url;
        this.refreshDetailModal(task, () => { task.cover_image = coverUrl; });
      });
    });

    this.detailModalBodyEl.querySelectorAll('.delete-sub-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subId = e.target.dataset.subId;
        const subToDelete = task.subtasks.find(s => String(s.id) === String(subId));
        if (!subToDelete) return;

        const subIndex = task.subtasks.findIndex(s => String(s.id) === String(subId));

        this.refreshDetailModal(task, () => {
          task.subtasks.splice(subIndex, 1);
          this.pushUndoAction(`Subtarea "${subToDelete.text}" eliminada`, () => {
            task.subtasks.splice(subIndex, 0, subToDelete);
          });
        });
      });
    });

    const addSubBtn = document.getElementById('add-sub-card-btn');
    if (addSubBtn) {
      addSubBtn.addEventListener('click', () => {
        const input = document.getElementById('new-subtask-input');
        const val = input ? input.value.trim() : '';
        if (val) {
          this.refreshDetailModal(task, () => {
            task.subtasks.push({ id: uid(), text: val, status: 'todo', completed: false });
          });
        }
      });
    }

    const delTaskBtn = document.getElementById('delete-task-btn');
    if (delTaskBtn) {
      delTaskBtn.addEventListener('click', () => {
        const taskToBackup = JSON.parse(JSON.stringify(task));
        const taskIndex = this.tasks.findIndex(t => String(t.id) === String(task.id));
        if (taskIndex === -1) return;

        // Se muta el arreglo en su lugar: `this.tasks` es la MISMA referencia que
        // odooClient.demoTasks. Reasignarla con .filter() rompía el vínculo y el
        // persistDemo() siguiente volvía a guardar la tarea recién borrada.
        this.tasks.splice(taskIndex, 1);

        this.pushUndoAction(`Tarea "${task.name}" eliminada`, () => {
          this.tasks.splice(taskIndex, 0, taskToBackup);
        });

        this._detailTaskDeleted = true;
        odooClient.persistDemo();
        this.closeDetailModal();
      });
    }

    const saveDetailBtn = document.getElementById('save-detail-btn');
    if (saveDetailBtn) {
      saveDetailBtn.addEventListener('click', async () => {
        // Mismo volcado que usan los re-renders internos: título, icono, etapa,
        // prioridad, fecha, minuta, portada, socios y etiquetas.
        this.captureDetailForm(task);

        const newStageId = Array.isArray(task.stage_id) ? task.stage_id[0] : task.stage_id;
        const stageName = Array.isArray(task.stage_id) ? task.stage_id[1] : 'Actualizado';

        if (Number(this._detailPersistedStageId) !== Number(newStageId)) {
          await odooClient.updateTaskStage(task.id, newStageId, stageName);
          this._detailPersistedStageId = newStageId;
        }

        odooClient.persistDemo();
        this.closeDetailModal();
      });
    }

    // Notion Block Builder Handlers
    this.detailModalBodyEl.querySelectorAll('.add-block-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.refreshDetailModal(task, () => {
          if (type === 'callout') {
            task.blocks.push({ id: uid(), type: 'callout', icon: '💡', title: 'IMPORTANTE / NOTA', text: '', color: 'yellow' });
          } else if (type === 'table') {
            task.blocks.push({
              id: uid(),
              type: 'table',
              title: 'Tabla de Métricas',
              rows: [
                ['Métrica 1', '100', '100', '150'],
                ['Métrica 2', '$10k', '$10k', '$15k']
              ]
            });
          } else if (type === 'carousel') {
            task.blocks.push({ id: uid(), type: 'carousel' });
          } else if (type === 'note') {
            task.blocks.push({ id: uid(), type: 'note', title: 'Nota de Trabajo', text: '' });
          }
        });
      });
    });

    this.detailModalBodyEl.querySelectorAll('.delete-block-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const blockId = Number(e.target.dataset.blockId);
        const blockIdx = task.blocks.findIndex(b => Number(b.id) === blockId);
        if (blockIdx === -1) return;
        // Se borra por índice, no con filter(): así un id repetido nunca arrastra
        // a otro bloque junto con el que sí se pidió eliminar.
        this.refreshDetailModal(task, () => { task.blocks.splice(blockIdx, 1); });
      });
    });

    this.detailModalBodyEl.querySelectorAll('.move-block-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.dataset.idx);
        if (idx > 0) {
          this.refreshDetailModal(task, () => {
            const temp = task.blocks[idx];
            task.blocks[idx] = task.blocks[idx - 1];
            task.blocks[idx - 1] = temp;
          });
        }
      });
    });

    this.detailModalBodyEl.querySelectorAll('.move-block-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.dataset.idx);
        if (idx < task.blocks.length - 1) {
          this.refreshDetailModal(task, () => {
            const temp = task.blocks[idx];
            task.blocks[idx] = task.blocks[idx + 1];
            task.blocks[idx + 1] = temp;
          });
        }
      });
    });

    this.detailModalBodyEl.querySelectorAll('.add-table-row-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const blockId = Number(e.target.dataset.blockId);
        const blk = task.blocks.find(b => Number(b.id) === blockId);
        if (blk) {
          this.refreshDetailModal(task, () => {
            if (!Array.isArray(blk.rows)) blk.rows = [];
            blk.rows.push(['', '', '', '']);
          });
        }
      });
    });

    // Enlaza cada input de bloque con su campo. `.block-callout-icon` estaba
    // renderizado pero sin listener, así que el emoji nunca se guardaba.
    const bindBlockField = (selector, apply) => {
      this.detailModalBodyEl.querySelectorAll(selector).forEach(input => {
        input.addEventListener('input', (e) => {
          const blk = task.blocks.find(b => Number(b.id) === Number(e.target.dataset.blockId));
          if (blk) apply(blk, e.target);
        });
        input.addEventListener('change', () => odooClient.persistDemo());
      });
    };

    bindBlockField('.block-callout-icon', (blk, el) => { blk.icon = el.value.trim() || '💡'; });
    bindBlockField('.block-callout-title', (blk, el) => { blk.title = el.value; });
    bindBlockField('.block-callout-text', (blk, el) => { blk.text = el.value; });
    bindBlockField('.block-table-title', (blk, el) => { blk.title = el.value; });
    bindBlockField('.block-note-title', (blk, el) => { blk.title = el.value; });
    bindBlockField('.block-note-content', (blk, el) => { blk.text = el.value; });
    bindBlockField('.grid-cell-input', (blk, el) => {
      const rIdx = Number(el.dataset.row);
      const cIdx = Number(el.dataset.col);
      if (Array.isArray(blk.rows) && blk.rows[rIdx]) blk.rows[rIdx][cIdx] = el.value;
    });

    this.detailModalEl.classList.add('active');
  }

  closeDetailModal() {
    // Cerrar con la ✕ o clic fuera ya no descarta lo escrito: se guarda igual
    // que con "Guardar Cambios" (salvo la etapa, que sí requiere el botón).
    if (this._detailTask && !this._detailTaskDeleted) {
      this.captureDetailForm(this._detailTask);
      odooClient.persistDemo();
    }

    this._detailTask = null;
    this._detailTaskId = null;
    this._detailTaskDeleted = false;
    this.detailModalEl.classList.remove('active');
    this.renderCurrentView();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const app = new NotionKanbanApp();
    app.init();
  });
} else {
  const app = new NotionKanbanApp();
  app.init();
}
