import { initialMockStages, initialMockTasks } from './mockData.js';

// ⬆️ Bump this whenever mockData.js changes to force a localStorage reset
const DATA_VERSION = 'notion-v8-ventas-force-reset';

class OdooApiClient {
  constructor() {
    this.config = {
      isDemo: true,
      url: localStorage.getItem('odoo_url') || '',
      db: localStorage.getItem('odoo_db') || '',
      username: localStorage.getItem('odoo_user') || '',
      password: localStorage.getItem('odoo_pass') || '',
      model: localStorage.getItem('odoo_model') || 'project.task',
      stageModel: localStorage.getItem('odoo_stage_model') || 'project.task.type'
    };

    this.sessionId = localStorage.getItem('odoo_session_id') || null;
    this.uid = localStorage.getItem('odoo_uid') || null;
    this.demoStages = initialMockStages;

    // Strict Cache Invalidation & Task Verification
    const storedVersion = localStorage.getItem('notion_data_version');
    let storedTasks = null;

    try {
      storedTasks = JSON.parse(localStorage.getItem('notion_demo_tasks'));
    } catch (e) {
      storedTasks = null;
    }

    const hasDesignarCards = Array.isArray(storedTasks) && storedTasks.some(t => t.projectId === 'designar' || t.name === 'Mercado Libre');
    const hasPenseEnTiCards = Array.isArray(storedTasks) && storedTasks.some(t => t.projectId === 'pense_en_ti' || t.name === 'Inventario de la tienda');
    const hasVentasCards = Array.isArray(storedTasks) && storedTasks.some(t => t.projectId === 'ventas');

    if (storedVersion !== DATA_VERSION || !hasDesignarCards || !hasPenseEnTiCards || !hasVentasCards) {
      console.log(`⚡ Resetting cache to fresh Notion tasks (version: ${DATA_VERSION})...`);
      this.demoTasks = JSON.parse(JSON.stringify(initialMockTasks));
      localStorage.setItem('notion_data_version', DATA_VERSION);
      this.persistDemo();
    } else {
      this.demoTasks = storedTasks;
    }
  }

  isDemoMode() {
    return this.config.isDemo;
  }

  setDemoMode(enabled) {
    this.config.isDemo = enabled;
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('odoo_url', this.config.url);
    localStorage.setItem('odoo_db', this.config.db);
    localStorage.setItem('odoo_user', this.config.username);
    localStorage.setItem('odoo_pass', this.config.password);
    localStorage.setItem('odoo_model', this.config.model);
    localStorage.setItem('odoo_stage_model', this.config.stageModel);
  }

  // Generic JSON-RPC Proxy Caller
  async callRpc(endpoint, params = {}) {
    if (this.config.isDemo) {
      throw new Error("Cannot call Odoo RPC in Demo Mode");
    }

    const payload = {
      jsonrpc: '2.0',
      method: 'call',
      params: params,
      id: Math.floor(Math.random() * 1000000)
    };

    const response = await fetch('/api/odoo-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        odooUrl: this.config.url,
        endpoint: endpoint,
        payload: payload
      })
    });

    const data = await response.json();

    if (data.error) {
      const errDetail = data.error.data ? data.error.data.message : data.error.message;
      throw new Error(errDetail || 'Error en petición RPC a Odoo');
    }

    return data.result;
  }

  // Authenticate session with Odoo
  async authenticate() {
    if (this.config.isDemo) return { success: true, message: 'Modo Demo Activo' };

    try {
      const result = await this.callRpc('/web/session/authenticate', {
        db: this.config.db,
        login: this.config.username,
        password: this.config.password
      });

      if (result && result.uid) {
        this.uid = result.uid;
        this.sessionId = result.session_id;
        localStorage.setItem('odoo_uid', this.uid);
        if (this.sessionId) localStorage.setItem('odoo_session_id', this.sessionId);
        return { success: true, user: result.name || result.username };
      } else {
        throw new Error('Credenciales incorrectas o base de datos no encontrada.');
      }
    } catch (err) {
      console.error('Odoo Auth Error:', err);
      throw err;
    }
  }

  // Execute call_kw (ORM methods in Odoo)
  async callKw(model, method, args = [], kwargs = {}) {
    return await this.callRpc('/web/dataset/call_kw', {
      model: model,
      method: method,
      args: args,
      kwargs: kwargs
    });
  }

  // Fetch Stages (Columns) per project
  async getStages(projectId = 'designar') {
    if (this.config.isDemo) {
      if (Array.isArray(this.demoStages)) return this.demoStages;
      return this.demoStages[projectId] || this.demoStages.designar || [];
    }

    try {
      const stages = await this.callKw(this.config.stageModel, 'search_read', [[]], {
        fields: ['id', 'name', 'sequence'],
        order: 'sequence asc, id asc'
      });

      return stages.map(s => ({
        id: s.id,
        name: s.name,
        sequence: s.sequence || 10,
        color: this.assignStageColor(s.name)
      }));
    } catch (err) {
      console.warn('Fallback a demo stages por error de Odoo:', err);
      return this.demoStages[projectId] || this.demoStages.designar || [];
    }
  }

  // Fetch Tasks (Cards)
  async getTasks() {
    if (this.config.isDemo) {
      return this.demoTasks;
    }

    try {
      const tasks = await this.callKw(this.config.model, 'search_read', [[['active', '=', true]]], {
        fields: ['id', 'name', 'stage_id', 'priority', 'user_ids', 'tag_ids', 'date_deadline', 'description', 'kanban_state'],
        limit: 100
      });

      return tasks.map(t => ({
        id: t.id,
        name: t.name,
        stage_id: t.stage_id ? [t.stage_id[0], t.stage_id[1]] : [0, 'Sin Etapa'],
        priority: t.priority || '0',
        kanban_state: t.kanban_state || 'normal',
        user_ids: Array.isArray(t.user_ids) ? t.user_ids.map(uid => ({ id: uid, name: 'Usuario ' + uid, avatar: '' })) : [],
        tag_ids: Array.isArray(t.tag_ids) ? t.tag_ids.map(tid => ({ id: tid, name: 'Etiqueta ' + tid, color: 'blue' })) : [],
        date_deadline: t.date_deadline || null,
        description: t.description || '',
        subtasks: []
      }));
    } catch (err) {
      console.warn('Fallback a demo tasks por error:', err);
      return this.demoTasks;
    }
  }

  // Move Card to new Stage
  async updateTaskStage(taskId, newStageId, stageName) {
    if (this.config.isDemo) {
      const task = this.demoTasks.find(t => t.id === Number(taskId));
      if (task) {
        task.stage_id = [Number(newStageId), stageName];
        this.persistDemo();
      }
      return true;
    }

    try {
      await this.callKw(this.config.model, 'write', [[Number(taskId)], { stage_id: Number(newStageId) }]);
      return true;
    } catch (err) {
      console.error('Error al actualizar etapa en Odoo:', err);
      throw err;
    }
  }

  // Create new Task
  async createTask(name, stageId, stageName, projectId = 'designar') {
    if (this.config.isDemo) {
      const newTask = {
        id: Date.now(),
        projectId: projectId,
        name: name,
        stage_id: [Number(stageId), stageName],
        priority: '0',
        kanban_state: 'normal',
        user_ids: [{ id: 1, name: 'Abelardo Navarrete', role: 'abelardo' }],
        tag_ids: [{ id: 99, name: 'Nuevo', color: 'emerald' }],
        date_deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        description: 'Tarea creada directamente desde el panel Notion Kanban.',
        subtasks: []
      };
      this.demoTasks.push(newTask);
      this.persistDemo();
      return newTask;
    }

    try {
      const createdId = await this.callKw(this.config.model, 'create', [{
        name: name,
        stage_id: Number(stageId)
      }]);

      return {
        id: createdId,
        projectId: projectId,
        name: name,
        stage_id: [Number(stageId), stageName],
        priority: '0',
        kanban_state: 'normal',
        user_ids: [],
        tag_ids: [],
        date_deadline: null,
        description: '',
        subtasks: []
      };
    } catch (err) {
      console.error('Error al crear tarea en Odoo:', err);
      throw err;
    }
  }

  // Helper colors for stage header
  assignStageColor(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('no iniciado') || lower.includes('backlog')) return 'var(--column-gray)';
    if (lower.includes('en curso') || lower.includes('proceso')) return 'var(--column-blue)';
    if (lower.includes('atrasado') || lower.includes('urgente')) return 'var(--column-pink)';
    if (lower.includes('terminado') || lower.includes('complet')) return 'var(--column-emerald)';
    return 'var(--column-gray)';
  }

  persistDemo() {
    localStorage.setItem('notion_demo_tasks', JSON.stringify(this.demoTasks));
  }

  resetDemo() {
    this.demoStages = initialMockStages;
    this.demoTasks = JSON.parse(JSON.stringify(initialMockTasks));
    this.persistDemo();
  }
}

export const odooClient = new OdooApiClient();
