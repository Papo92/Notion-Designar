# 🤝 Notion Designar — Tablero Kanban & Gestión de Socios

![Notion Kanban](https://img.shields.io/badge/Version-3.8.0-blue.svg)
![Status](https://img.shields.io/badge/Status-Production-emerald.svg)

Tablero Kanban web interactivo diseñado para **Designar Souvenirs** y **Expansión PD: Pensé en ti**. Réplica fiel de la base de datos de Notion con soporte para Sub-Kanban de hitos, filtros por socios (Abelardo Navarrete & Regina Manjarrez), gestión de imágenes de portada, carga de archivos adjuntos y auto-despliegue en VPS Hetzner con Docker y Coolify.

---

## 🌐 Producción & URL Oficial

👉 **[https://kanban.designar.cc](https://kanban.designar.cc)**

---

## 🛠️ Tecnologías

- **Frontend**: HTML5, Vanilla CSS3 (CSS Variables, Dark/Light Mode), Javascript ES Modules.
- **Backend / Proxy**: Node.js + Express.js (Servidor con middleware anti-caché y proxy de carga de archivos).
- **Infraestructura**: Docker Compose, Hetzner VPS (`5.161.202.40`), Coolify + Traefik Reverse Proxy.
- **CI/CD**: GitHub Actions con auto-deploy mediante SSH/Webhook.

---

## 🎨 Espacios de Trabajo

### 1. 🎨 Designar Souvenirs (`id: designar`)
- 💳 **Mercado Libre** (● No iniciado)
- 🤖 **Automatización designar** (● No iniciado)
- 📢 **Campañas META ads** (● En curso)
- 🌐 **Pagina web** (● En curso)
- 🎟️ **Vendedoras 2026** (● Atrasado)
- 🤖 **Setter AI** (● Terminado)

### 2. 🎁 Expansión PD: Pensé en ti (`id: pense_en_ti`)
- 📦 **Inventario de la tienda** (● No iniciado)
- 🎨 **Brochure Tienda** (● No iniciado)
- 📍 **Buscar Locales** (● Atrasado)
- 📦 **Creación de nuevos productos** (● En curso)
- ⚖️ **Dar de alta en el IMPI** (● Terminado)
- 📘 **Manual de identidad** (● Terminado)

---

## 🚀 Despliegue Automático (CI/CD Auto-Deploy)

Este repositorio cuenta con un flujo de trabajo de **GitHub Actions** (`.github/workflows/deploy.yml`) que se activa automáticamente al hacer `push` a la rama `main`:

```bash
# 1. Realizar cambios locales
git add .
git commit -m "feat: actualización de funciones"

# 2. Push a la rama main
git push origin main
# 🚀 GitHub Actions despliega los cambios al servidor automáticamente
```

---

## 📁 Estructura del Proyecto

```
odoo-notion-kanban/
├── .github/
│   └── workflows/
│       └── deploy.yml      # Pipeline de Auto-Deploy en GitHub Actions
├── server.js              # Servidor Express + Middleware Anti-Cache
├── docker-compose.yaml    # Configuración de contenedores y volúmenes
├── Dockerfile             # Imagen de producción
├── README.md              # Documentación principal
├── CHANGELOG.md           # Registro exhaustivo de fallos y soluciones
└── public/
    ├── index.html         # HTML5 + Script buster de caché Brave/Chrome
    ├── css/
    │   └── styles.css     # Estilos Vanilla CSS + Variables de tema
    └── js/
        ├── app.js         # Lógica principal del Kanban y Modales
        ├── odooApi.js     # Cliente API + Verificador de versión de datos
        └── mockData.js    # Base de datos oficial extraída de Notion
```

---

## 👤 Equipo & Contacto

- **Empresa**: Designar Souvenirs (Mérida, Yucatán)
- **Socios**: Abelardo Navarrete & Regina Manjarrez Martin
