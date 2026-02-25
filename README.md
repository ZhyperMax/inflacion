Inflation Dashboard – README
=============================

Descripción
-----------
Inflation Dashboard es una web minimalista para seguir la inflación por país usando datos oficiales: cada país obtiene datos anuales desde el World Bank y Argentina puede mostrar datos mensuales (INDEC / datos.gob.ar).

Características principales
--------------------------
- Comparador entre dos países (A / B).
- Toggle `Anual / Mensual (solo Argentina)` — mensual usa la API de datos.gob.ar.
- Gráfico con animación y área rellena.
- Simulador de poder adquisitivo (calcula cuánto necesitarías hoy para mantener el mismo poder de compra de X hace N períodos).
- Prefetch y cache local en memoria para mejorar UX; los países que no cargan se marcan como "(pendiente)" en los selectores.

Archivos relevantes
-------------------
- Interfaz principal: [index.html](index.html)
- Lógica y fetch/API: [app.js](app.js)
- Estilos: [styles.css](styles.css)

Fuentes de datos
----------------
- World Bank (anual): indicador `FP.CPI.TOTL.ZG` — usado para la mayoría de los países.
- INDEC / datos.gob.ar (Argentina, mensual): serie recomendada `145.3_INGNACUAL_DICI_M_38`.
  - Endpoint ejemplo (últimos 12 meses, JSON):

```text
https://apis.datos.gob.ar/series/api/series?ids=145.3_INGNACUAL_DICI_M_38&last=12&format=json
```

Notas técnicas
--------------
- Inflación acumulada: se calcula como inflación compuesta (multiplicación de factores), no suma simple. Por eso los porcentajes acumulados pueden ser muy altos.
- El toggle mensual solo está disponible cuando `Pais A` es Argentina. Si se intenta activar mensual con otro país seleccionado, la app muestra un aviso.
- Prefetch: se intenta precargar todos los países en background con un timeout (2s). Los que no respondan quedan marcados como "(pendiente)".
- Caching: los datos se guardan en `inflationCache` (memoria). El cache usa clave con el formato `{codigo}-{modo}` (ej. `AR-mensual`) para separar anual/mensual.

Cómo ejecutar localmente
------------------------
Opción 1 — abrir directamente:
- Abrí `index.html` en tu navegador (puede funcionar abriendo el archivo localmente, aunque algunas APIs requieren servidor por CORS).

Opción 2 — servidor simple (recomendado):

```bash
# desde la carpeta del proyecto
python -m http.server 5500
# luego abrir http://127.0.0.1:5500/index.html
```

Qué editar si querés cambiar algo
--------------------------------
- Cambiar paleta/estilos: editar [styles.css](styles.css)
- Ajustar lógica o endpoints: editar [app.js](app.js)
- Texto y estructura: editar [index.html](index.html)

Créditos
--------
Programado por Beto

Contribuciones
--------------
Si querés contribuir, abrí un PR con pequeños cambios y una breve descripción.

Licencia
--------
Código sin licencia explícita (pedir confirmación si vas a publicarlo).