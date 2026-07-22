# 📜 CHANGELOG — Registro de Fallos y Soluciones (Notion Designar)

Este documento registra de forma exhaustiva todos los fallos detectados, sus causas raíz y las soluciones de ingeniería aplicadas durante el desarrollo y despliegue del proyecto.

---

## 🛑 FALLO 1: TypeError Fatal al Eliminar Botones del HTML
- **Síntoma**: El tablero se quedaba congelado permanentemente en la pantalla estática "Cargando..." y la interfaz no respondía.
- **Causa Raíz**: Al remover los botones `<button id="odoo-config-btn">` y `<button id="reset-cache-btn">` del HTML, la función `bindEvents()` en `app.js` intentaba ejecutar `this.odooConfigBtnEl.addEventListener(...)` sobre un valor `null`. Esto lanzaba un `TypeError` fatal durante el constructor del objeto `NotionKanbanApp`, deteniendo la ejecución antes de cargar `loadData()`.
- **Solución**:
  1. Se agregaron comprobaciones condicionales `if (this.element)` en **TODOS** los escuchadores de eventos en `app.js`.
  2. Se aseguró que la falta de cualquier elemento en el DOM no detenga la inicialización.

---

## 🛑 FALLO 2: Error de Sintaxis por Reemplazo Fragmentado al Agregar Portadas
- **Síntoma**: Tras agregar la nueva sección de imagen de portada, el sitio volvió a quedar en blanco con mensaje "volvió a fallar".
- **Causa Raíz**: Durante un reemplazo parcial de código en `app.js`, se introdujeron fragmentos truncados dentro del template literal (ej: `${att.isImage ? `<button class="set-cover-bt // Cover...`), generando un error de sintaxis JS no capturado.
- **Solución**: Se reescribió el módulo `app.js` de forma limpia y completa, validando la sintaxis y garantizando un parsing limpio en todos los navegadores.

---

## 🛑 FALLO 3: Agresividad de Caché Disk/Memory en Brave Browser
- **Síntoma**: El usuario seguía viendo la versión desactualizada de la aplicación aun después de desplegar cambios al servidor VPS.
- **Causa Raíz**:
  1. Traefik (proxy inverso de Coolify) sobreescribía los encabezados `Cache-Control: no-store` enviados por Express y habilitaba `ETag`.
  2. La llamada nativa `location.reload(true)` está obsoleta (deprecated) en Brave y Chrome modernos, por lo que ignora el hard refresh y lee desde la caché del disco.
- **Solución**:
  1. En `server.js`: Se añadió un middleware global anti-caché antes de los archivos estáticos (`no-store, no-cache, must-revalidate`), desactivando `etag` y `lastModified`.
  2. En `index.html`: Se implementó un script buster de caché basado en URL. Si `sessionStorage` detecta un cambio de versión (`KANBAN_VERSION`), redirige automáticamente a `?_v=VERSION.TIMESTAMP`, una URL que Brave nunca ha visto, obligándolo a descargar los archivos limpios del servidor.

---

## 🛑 FALLO 4: Desincronización de Datos por Persistencia Local Vieja
- **Síntoma**: Las tarjetas del proyecto "Designar Souvenirs" desaparecían o mostraban datos anteriores.
- **Causa Raíz**: El objeto `localStorage` guardaba la clave `notion_demo_tasks` de sesiones anteriores. Si esas tarjetas no tenían explícitamente `projectId: 'designar'`, el filtro por proyecto las descartaba.
- **Solución**:
  1. En `odooApi.js`: Se creó un mecanismo estricto de validación de datos basado en `DATA_VERSION` (`notion-v6-full-official-export`). Si los datos locales no contienen las 12 tarjetas oficiales de Notion, purga el `localStorage` y restaura los datos frescos del ZIP de Notion.
  2. En `app.js`: En `getFilteredTasks()`, si una tarjeta no tiene `projectId`, asigna por defecto `'designar'` para evitar su filtrado erróneo.

---

## 🛑 FALLO 5: Falta de Persistencia en Ediciones Interactivas (Sub-Kanban & Detalles)
- **Síntoma**: Al arrastrar subtareas dentro del Sub-Kanban, editar títulos o eliminar elementos dentro del modal, los cambios se perdían al recargar la página.
- **Causa Raíz**: Los eventos de edición dentro del modal no invocaban `odooClient.persistDemo()`.
- **Solución**: Se integró `odooClient.persistDemo()` en todas las acciones interactivas: arrastrar subtareas, renombrar títulos, agregar subtareas, cambiar fechas, eliminar tarjetas y en el sistema de deshacer `Ctrl + Z`.

---

## 🛑 FALLO 6: Incompatibilidad de Tipos en IDs (Number vs String)
- **Síntoma**: Al arrastrar o borrar subtareas extraídas de la exportación en CSV/HTML de Notion, algunas acciones no respondían.
- **Causa Raíz**: Las comparaciones estrictas (`===` con `Number(id)`) fallaban cuando los identificadores de subtareas eran cadenas de texto (ej: `"1"`, `"2"`).
- **Solución**: Se estandarizaron todas las comparaciones de IDs utilizando `String(a) === String(b)`.

---

## 🛑 FALLO 7: Despliegues Ignorados en Docker Compilado
- **Síntoma**: Cambios realizados en `server.js` en el VPS no surtían efecto al ejecutar `docker restart`.
- **Causa Raíz**: `server.js` fue copiado dentro de la imagen en la etapa de `docker build`, por lo que el contenedor usaba el archivo compilado originalmente.
- **Solución**: Se actualizó `docker-compose.yaml` para montar `./server.js:/app/server.js` y `./public:/app/public` como volúmenes en vivo.
