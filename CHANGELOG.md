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

---

## 🛑 FALLO 17: Alta Duplicada de Tareas por Doble Inserción en el Arreglo Compartido
- **Síntoma**: Al crear una tarjeta desde el botón "Añadir tarjeta" de una columna, aparecían **dos** tarjetas idénticas en lugar de una.
- **Causa Raíz**: En modo demo `odooClient.createTask()` ya inserta la tarea con `this.demoTasks.push(newTask)`. Como `getTasks()` devuelve `this.demoTasks` **por referencia**, `app.tasks` y `odooClient.demoTasks` son el mismo arreglo, así que el `this.tasks.push(newTask)` del handler en `app.js` insertaba el mismo objeto por segunda vez. Ambas copias compartían el mismo `id`, lo que además rompía el borrado y la edición. En modo Odoo real `createTask()` no inserta, por lo que ahí ese `push` sí es necesario.
- **Solución**:
  1. En `app.js` el `push` solo se ejecuta si la tarea no está ya en el arreglo (`t === newTask || String(t.id) === String(newTask.id)`), lo que funciona en ambos modos.
  2. Se añadió un guardián de reentrada `submitting` para que un doble Enter durante el `await` no cree dos tarjetas.
  3. En `odooApi.js` se añadió `dedupeTasks()`, que al cargar elimina las tarjetas con `id` repetido que quedaron guardadas en `localStorage` por versiones anteriores, conservando la primera aparición.
- **Alcance**: Presente desde la v3.8.0; no fue introducido por las correcciones de la v5.3.0.
- **Prevención**: Cuando un método de la capa de datos ya inserta el registro, el llamador no debe volver a insertarlo. Con arreglos compartidos por referencia entre módulos, definir un único punto de inserción.

---

## 🛑 FALLO 18: Las Columnas del Tablero Nunca se Guardaban
- **Síntoma**: Renombrar una columna, cambiarle el color, reordenarla, crear una nueva o borrar una existente se perdía por completo al recargar la página.
- **Causa Raíz**: `persistDemo()` solo escribe `notion_demo_tasks`. Las etapas vivían únicamente en memoria (`this.demoStages = initialMockStages`), sin ninguna clave de `localStorage`, y además se mutaba directamente el objeto importado de `mockData.js`.
- **Solución**: Se añadió una capa de persistencia de etapas en `odooApi.js` (`notion_demo_stages`) con `loadStages()` y `persistStages()`. `loadStages()` conserva lo guardado por el usuario y rellena solo los proyectos que aún no tengan columnas propias, de modo que añadir un proyecto nuevo a `mockData.js` sigue funcionando. Todas las mutaciones de columna en `app.js` llaman ahora a `persistStages()`.
- **Prevención**: Todo estado que el usuario pueda modificar necesita su ruta de guardado; no basta con volver a renderizar.

---

## 🛑 FALLO 19: Tarjetas Invisibles al Mover a una Columna Nueva
- **Síntoma**: Se creaba una columna, se arrastraba una tarjeta hacia ella y, tras recargar, la tarjeta desaparecía del tablero. Seguía existiendo (se veía en las vistas Tabla y Galería), pero el Kanban no la mostraba.
- **Causa Raíz**: Consecuencia del FALLO 18. El movimiento de la tarjeta sí se guardaba (`persistDemo()`), pero la columna destino no. Al recargar, la tarea apuntaba a un `stage_id` inexistente y `renderBoardView()`, que dibuja recorriendo `this.stages` y filtrando por id, nunca la incluía en ninguna columna.
- **Solución**:
  1. Al persistir las etapas (FALLO 18), la columna destino sobrevive y el caso deja de producirse.
  2. Como red de seguridad para los datos ya guardados, `renderBoardView()` agrupa ahora las tareas cuya etapa no existe en una columna "⚠️ Sin etapa" desde la que se pueden arrastrar de vuelta.
- **Prevención**: Un renderizado que recorre un catálogo y filtra por clave foránea debe contemplar siempre las filas sin correspondencia, en lugar de omitirlas en silencio.

---

## 🛑 FALLO 20: Borrar una Columna Dejaba los Datos Incoherentes
- **Síntoma**: Al borrar una columna, sus tareas se movían a otra y el borrado parecía correcto; tras recargar, la columna reaparecía vacía y las tareas se quedaban donde fueron movidas.
- **Causa Raíz**: El movimiento de las tareas se guardaba pero el borrado de la etapa no (FALLO 18). Además `this.stages = this.stages.filter(...)` rompía la referencia compartida con `odooClient.demoStages[proyecto]`, el mismo patrón del FALLO 16.
- **Solución**: Se sustituyó por `this.stages.splice(originalIndex, 1)` y se añadió `persistStages()` tanto al borrado como a su acción de deshacer.
- **Prevención**: Con arreglos compartidos por referencia entre módulos, mutar siempre en su lugar; nunca reasignar con `filter()`.

---

## 🛑 FALLO 21: El Botón "+ Nueva Tarea" de la Cabecera No Hacía Nada
- **Síntoma**: Pulsar "+ Nueva Tarea" en la cabecera no producía ningún efecto visible ni mensaje de error.
- **Causa Raíz**: El handler llamaba `promptNewCard(stageId, stageName)` sin el tercer parámetro `colEl`. Dentro del método, el formulario solo se inserta en el DOM con `colEl.querySelector('.cards-container').appendChild(formEl)`, así que el elemento se creaba y quedaba huérfano, fuera del documento.
- **Solución**: El handler localiza ahora la primera `.kanban-column` del tablero y se la pasa como `colEl`. Si el usuario está en Tabla o Galería, cambia primero a la vista Kanban (actualizando la pestaña activa) para que el formulario tenga dónde insertarse.
- **Prevención**: Un parámetro opcional que en la práctica es obligatorio para que la función tenga efecto visible debe validarse o dejar de ser opcional.

---

## 🛑 FALLO 22: Escapado de HTML Ausente en las Vistas Kanban, Tabla y Galería
- **Síntoma**: Un nombre como `Lona 12" x 18" <img src=x onerror=...>` insertaba un elemento real en la tarjeta del tablero, en la fila de la tabla y en la tarjeta de la galería.
- **Causa Raíz**: El helper `esc()` del FALLO 14 se aplicó solo al modal de detalle. `createCardElement()`, `renderTableView()` y `renderGalleryView()` seguían interpolando en crudo nombres, iconos, etiquetas, portadas, socios y nombres de etapa.
- **Solución**: Se aplicó `esc()` a todas las interpolaciones de las tres vistas y a los nombres y colores de columna.
- **Prevención**: Al introducir un helper de escapado, recorrer todas las rutas de renderizado en la misma edición, no solo la que motivó el cambio.

---

## 🛑 FALLO 23: Una Tarea que Vence Hoy se Marcaba como Atrasada
- **Síntoma**: Las tarjetas con fecha límite de hoy mostraban la píldora roja de "atrasado" y entraban en el filtro "urgente".
- **Causa Raíz**: `new Date('2026-07-31') < new Date()`. Una cadena `YYYY-MM-DD` se interpreta como medianoche **UTC**; en UTC−6 esa medianoche corresponde a las 18:00 del día anterior en hora local, así que a cualquier hora del día la fecha ya quedaba en el pasado.
- **Solución**: Se añadió el helper `isOverdue(dateStr)`, que construye la fecha con `new Date(año, mes-1, día)` (hora local) y la compara contra hoy a medianoche local. Se usa tanto en la píldora de la tarjeta como en el filtro "urgente".
- **Prevención**: No comparar cadenas `YYYY-MM-DD` con `new Date()` directamente; construir la fecha en hora local y normalizar a medianoche.

---

## 🛑 FALLO 24: Los Videos y Documentos de Office se Rechazaban al Subirlos
- **Síntoma**: Al adjuntar un video aparecía la alerta `Error subiendo archivo: Invalid base64 string format.` Las imágenes y los PDF sí funcionaban.
- **Causa Raíz**: En `server.js` el `data:` URI se validaba con `/^data:([A-Za-z-+\/]+);base64,(.+)$/`. Esa clase de caracteres **no incluye dígitos ni puntos**, así que `video/mp4` fallaba por el `4`, `audio/mp3` por el `3` y los tipos de Office (`application/vnd.openxmlformats-officedocument...`) por los puntos. Solo pasaban los MIME formados únicamente por letras, como `image/png` o `application/pdf`.
- **Solución**: Se amplió el patrón a los caracteres que admite un tipo MIME (`[a-zA-Z0-9!#$&^_.+-]+/[a-zA-Z0-9!#$&^_.+-]+`) y el mensaje de error ahora incluye la cabecera recibida para poder diagnosticarlo.
- **Prevención**: Al validar tipos MIME con expresiones regulares, contemplar dígitos, puntos y guiones; no asumir que son solo letras.

---

## 🛑 FALLO 25: Un Archivo Grande Devolvía un Error Incomprensible
- **Síntoma**: Al subir un archivo por encima del límite, el mensaje que veía el usuario era un error de parseo de JSON sin relación con el problema real.
- **Causa Raíz**: Al superar el límite de `express.json()`, Express responde con una página **HTML** de error 413. El cliente hacía `await res.json()` sobre ese HTML y lanzaba una excepción de sintaxis que se mostraba tal cual.
- **Solución**:
  1. En `server.js`, un manejador de errores devuelve ahora JSON con un mensaje claro ante `entity.too.large`, y el límite subió a `100mb` (~75 MB reales, porque base64 infla ~33%).
  2. En `app.js`, `handleFileUpload()` comprueba `file.size` **antes** de leer el archivo y avisa con el peso real y el máximo permitido, sugiriendo enlazar los videos grandes desde Drive o YouTube.
  3. Si aun así la respuesta no es JSON, se traduce al código y texto de estado HTTP en lugar del error de parseo.
- **Prevención**: Una API que responde JSON debe hacerlo también en sus rutas de error; y el cliente no debe asumir que toda respuesta es JSON.

---

## 🛑 FALLO 26: Los Videos Adjuntos No se Podían Reproducir
- **Síntoma**: Una vez subido, un video aparecía como un genérico `📄 nombre.mp4` sin forma de verlo dentro del panel.
- **Causa Raíz**: La tarjeta de adjuntos solo distinguía entre imagen y "documento" (`att.isImage`).
- **Solución**: Los adjuntos guardan ahora `isVideo` y la tarjeta renderiza un `<video controls preload="metadata">`.
- **Nota**: También se cambió el `id` del adjunto de `Date.now()` a `uid()` por el FALLO 15, y se añadió `public/uploads/` al `.gitignore`: son datos de usuario y no deben viajar en los commits ni en la imagen Docker.

---

# ✨ MEJORAS

## 🚀 v5.5.0 — Edición rápida, resumen del proyecto y pulido de interfaz

Hasta aquí el registro recoge correcciones. Esta entrada documenta mejoras
funcionales pedidas tras revisar que el panel "se veía básico".

### Edición sin abrir el modal
- **Tabla ordenable**: las 7 cabeceras ordenan al pulsarlas y el segundo clic invierte el sentido, con flecha indicadora. El criterio elegido se guarda en `notion_table_sort` y se recuerda entre sesiones. Al ordenar por fecha, las tareas sin fecha van siempre al final independientemente del sentido.
- **Celdas editables en la tabla**: nombre, etapa, prioridad y fecha se editan con un clic. `stopPropagation()` evita que el clic suba a la fila y abra el modal.
- **Píldoras editables en la tarjeta Kanban**: prioridad y fecha se cambian desde la propia tarjeta. La prioridad ahora se muestra siempre (antes solo aparecía si era alta o urgente) y las tareas sin fecha ofrecen un "Sin fecha" pulsable.
- Helper común `inlineEdit()`: sustituye el elemento por un control, guarda con `change`, `blur` o Enter, y cancela con Escape. Un guardián interno evita el doble guardado, porque `change` y `blur` se disparan ambos al elegir en un desplegable.

### Resumen del proyecto
- Franja superior con tareas totales, atrasadas, vencimientos de los próximos 7 días y completadas; avance global; mini gráfico de barras por etapa; y reparto por socio.
- Refleja exactamente lo que hay en pantalla: responde a la búsqueda y al filtro de socio, y se oculta cuando no hay nada que resumir.

### Pulido de interfaz
- **Estados vacíos** en las tres vistas, con botón para limpiar los filtros. Antes una búsqueda sin resultados dejaba la pantalla en blanco sin explicación. En el Kanban solo sustituyen al tablero si el vacío lo causa un filtro: si el proyecto simplemente no tiene tareas, las columnas se conservan para poder crear la primera.
- **Arrastrar y soltar**: la columna destino se resalta y muestra un hueco "Soltar aquí" animado; la tarjeta arrastrada se inclina y atenúa; al soltar aparece una confirmación con el destino.
- **Esqueleto de carga** con la forma del tablero, en lugar de la línea de texto "Cargando vista Notion...".
- **Notificaciones en lugar de `alert()`**: se eliminaron los 6 `alert()` bloqueantes. Los mensajes de error se muestran en rojo y duran más. `showToast()` ahora escapa el HTML, que era otra vía de inyección.
- **Galería más densa**: cada tarjeta muestra fecha límite (en rojo si está vencida) y los socios asignados.
- Transición suave al cambiar de vista y respeto a `prefers-reduced-motion`.
