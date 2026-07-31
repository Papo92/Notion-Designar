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

---

## 🛑 FALLO 8: ReferenceError por Referencia a Función de Renderizado en Template Literal (Temporal Dead Zone)
- **Síntoma**: Al hacer clic en cualquier tarjeta o intentar abrir el modal de detalles, la aplicación dejaba de responder silenciosamente y en consola mostraba `ReferenceError: Cannot access 'renderTaskBlocks' before initialization`.
- **Causa Raíz**: Se invocó `${renderTaskBlocks(task.blocks)}` dentro del `innerHTML` de `openDetailModal()`, pero la función helper `const renderTaskBlocks = ...` estaba definida líneas más abajo en la misma función.
- **Solución**: Se movieron todas las declaraciones auxiliares (`renderSubCards`, `renderAttachments`, `renderTaskBlocks`) al inicio del cuerpo del método `openDetailModal()`, antes de la asignación del `innerHTML`.
- **Prevención**: Declarar siempre las funciones auxiliares de renderizado al inicio del scope del método antes de construir plantillas de texto HTML.

---

## 🛑 FALLO 9: Desincronización de Datos al Añadir un Nuevo Proyecto (Ventas)
- **Síntoma**: El nuevo espacio de trabajo "Ventas & Juntas Semanales" aparecía en el selector, pero las columnas y tarjetas no se mostraban.
- **Causa Raíz**: `localStorage['notion_demo_tasks']` contenía los datos de sesiones previas. La validación `hasDesignarCards` evaluaba como verdadera y prevenía la reconstrucción automática del `localStorage` con las tarjetas del nuevo proyecto.
- **Solución**: Se añadió la verificación `hasVentasCards` en `odooApi.js` y se incrementó `DATA_VERSION` a `'notion-v8-ventas-force-reset'`.
- **Prevención**: Al añadir un nuevo proyecto a `mockData.js`, registrar inmediatamente su comprobación `has[Nombre]Cards` en `odooApi.js` para forzar la re-semilla en todos los navegadores.


---

## 🛑 FALLO 10: Llave de Cierre Perdida en `@media` — Bloques Notion Sin Estilos en Escritorio
- **Síntoma**: El constructor de bloques (callouts, cuadrículas, carrusel, notas) se veía completamente sin estilo en pantallas de escritorio; solo se aplicaba correctamente en móvil.
- **Causa Raíz**: Al reemplazar la regla `.undo-toast` por el nuevo CSS del block builder en `styles.css`, el reemplazo se llevó la llave `}` que cerraba el bloque `@media (max-width: 768px)`. Los 95 renglones nuevos quedaron anidados dentro del media query (conteo de llaves: 184 `{` vs 183 `}`). De paso se perdió el ajuste móvil de `.undo-toast`.
- **Solución**: Se restauró la llave de cierre del `@media` y la regla `.undo-toast { justify-content: space-between; width: 100%; }` dentro de él.
- **Prevención**: Tras editar CSS, verificar que el conteo de `{` y `}` sea idéntico y que la profundidad al final del archivo sea 0.

---

## 🛑 FALLO 11: Re-render del Modal Descarta Todo lo Escrito sin Guardar
- **Síntoma**: Al escribir la minuta y luego pulsar "+ Nota de Texto" (la barra de bloques está justo arriba del textarea), el texto desaparecía. Lo mismo al subir un archivo, mover una subtarea o crear una etiqueta.
- **Causa Raíz**: Todos los handlers internos del modal terminaban en `openDetailModal(task)`, que reconstruye el `innerHTML` a partir del objeto `task`. Nombre, minuta, fecha, prioridad, portada, socios y etiquetas solo se volcaban al objeto en el handler de "Guardar Cambios", así que cualquier re-render intermedio los perdía en silencio.
- **Solución**:
  1. Se creó `captureDetailForm(task)`, que vuelca el estado actual del DOM al objeto `task`.
  2. Se creó `refreshDetailModal(task, mutate)` con el orden capturar → mutar → persistir → redibujar, y se sustituyeron los ~15 re-renders internos.
  3. `closeDetailModal()` ahora también captura y persiste: cerrar con la ✕ o clic fuera ya no descarta lo escrito.
  4. El handler de "Guardar Cambios" reutiliza `captureDetailForm()` en lugar de duplicar la lectura de campos.
- **Prevención**: Si un método reconstruye `innerHTML` desde un objeto de datos, todo handler que lo invoque debe volcar antes el estado del formulario a ese objeto.

---

## 🛑 FALLO 12: Reset Destructivo de `localStorage` al Vaciar un Tablero
- **Síntoma**: Riesgo de pérdida total de trabajo: si el usuario eliminaba las 4 tarjetas sembradas de Ventas, la siguiente recarga borraba `notion_demo_tasks` completo y re-sembraba, destruyendo también lo hecho en Designar y Piensa en Ti.
- **Causa Raíz**: La condición de reset del FALLO 9 (`|| !hasVentasCards`) no distingue entre "caché vieja" y "el usuario vació ese tablero a propósito". Cualquiera de los dos casos disparaba una purga total.
- **Solución**: El reset completo ahora ocurre solo si cambia `DATA_VERSION` o si no hay datos. Si falta un tablero sembrado, `seedMissingProjects()` reinserta **únicamente** las tarjetas de ese proyecto, sin borrar ni sobrescribir las existentes (se salta cualquier `id` ya presente).
- **Prevención**: Nunca condicionar una purga total de `localStorage` a la presencia de registros individuales que el usuario puede eliminar legítimamente.

---

## 🛑 FALLO 13: Icono del Callout Renderizado pero Sin Escuchador
- **Síntoma**: Cambiar el emoji de un bloque Callout no tenía efecto: al siguiente re-render volvía a `💡`.
- **Causa Raíz**: `.block-callout-icon` se renderizaba como `<input>` editable, pero en todo `app.js` la clase solo aparecía en el sitio de renderizado. Nunca se registró un listener `input`/`change`, así que el valor jamás llegaba a `blk.icon`.
- **Solución**: Se consolidaron los 7 enlaces de campos de bloque en el helper `bindBlockField(selector, apply)`, incluyendo `.block-callout-icon`.
- **Prevención**: Al añadir un input editable dentro de una plantilla, registrar su listener en la misma edición.

---

## 🛑 FALLO 14: Interpolación de HTML sin Escapar (Truncado y Riesgo de Inyección)
- **Síntoma**: Un valor con comillas dobles, por ejemplo `Lona 12" x 18"`, se truncaba en la primera comilla al re-renderizar. Además, un valor como `"><img src=x onerror=…>` inyectaba marcado en el modal.
- **Causa Raíz**: Títulos, iconos, celdas de cuadrícula, nombres de adjuntos, etiquetas y URLs se interpolaban en crudo dentro de atributos `value="..."`; el proyecto no tenía helper de escapado.
- **Solución**: Se añadió `esc(value)` (escapa `& < > " '`) y se aplicó a las 20 interpolaciones del modal: bloques, adjuntos, carrusel, etiquetas, subtareas, portada, nombre, icono y minuta.
- **Prevención**: Todo dato de usuario que entre a un template literal HTML debe pasar por `esc()`.

---

## 🛑 FALLO 15: IDs Duplicados por `Date.now()` en Handlers Síncronos
- **Síntoma**: Dos bloques creados en el mismo milisegundo compartían `id`. Al borrar uno se borraban ambos, y editar un campo afectaba siempre al primero.
- **Causa Raíz**: Todos los elementos nuevos (bloques, subtareas, etiquetas) usaban `id: Date.now()`. Como los handlers de creación son totalmente síncronos, dos clics o dos inserciones seguidas obtienen el mismo valor. El borrado usaba `filter()` por valor y la edición `find()`, que devuelve la primera coincidencia.
- **Solución**: Se añadió `uid()`, un generador monótono (`Math.max(Date.now(), __lastUid + 1)`) que garantiza IDs únicos y crecientes. El borrado de bloques ahora usa `splice()` por índice en lugar de `filter()` por valor.
- **Prevención**: No usar `Date.now()` como generador de identificadores en código síncrono.

---

## 🛑 FALLO 16: Reasignar `this.tasks` Rompe la Referencia con `odooClient.demoTasks`
- **Síntoma**: Al eliminar una tarjeta, esta reaparecía tras recargar la página.
- **Causa Raíz**: En modo demo `getTasks()` devuelve `this.demoTasks` directamente, así que `app.tasks` y `odooClient.demoTasks` son el **mismo** arreglo. El borrado hacía `this.tasks = this.tasks.filter(...)`, que crea un arreglo nuevo y rompe ese vínculo; el `odooClient.persistDemo()` siguiente serializaba `demoTasks`, que aún contenía la tarea eliminada.
- **Solución**: Se sustituyó por `this.tasks.splice(taskIndex, 1)`, que muta el arreglo compartido en su lugar. El mismo criterio se aplicó al borrado de subtareas.
- **Prevención**: Con arreglos compartidos por referencia entre módulos, mutar siempre en su lugar (`splice`, `push`); nunca reasignar con `filter()`/`map()`.
