# 📊 Inflation Dashboard

Dashboard minimalista para seguir inflación mundial en tiempo real. Compara tasas anuales (World Bank) y mensuales para Argentina (INDEC). Datos oficiales, sin dependencias externas pesadas.

## ✨ Características

### 🌍 Comparador de Países
- Selecciona dos países (A y B) para comparación
- Soporta 8 países latinoamericanos
- Cálculo automático de diferencias
- Bandera de países en selector

### 📈 Vista Anual/Mensual
- **Anual:** Datos desde World Bank para 8 países
- **Mensual:** Disponible solo para Argentina (INDEC)
- Toggle dinámico activable solo con Argentina
- Historial completo visible en tabla

### 📉 Gráfico de Trayectoria
- Visualización de 12 años de datos
- Dos líneas para comparación país A/B
- Área rellena con gradientes
- Animate smooth on load
- Leyenda interactiva

### 💰 Simulador de Poder Adquisitivo
- Calcula cuánto necesitarías hoy para tener el mismo poder de compra de hace X períodos
- Compare el impacto inflacionario entre países
- Cálculos en tiempo real
- Actualización automática al cambiar período

### 📊 Métricas Detalladas
- Tasa actual de inflación
- Inflación acumulada (compuesta)
- Promedio del período
- Indicadores de tendencia (↑↓→)
- Delta respecto al período anterior

### 📱 Historial de Datos
- Tabla completa de períodos
- Variación mes a mes (solo mensual)
- Períodos mensuales o anuales según vista
- Scroll fluido con información completa

### 🎨 Diseño Moderno
- Tema blanco/minimalista optimizado
- Badge de fuentes de datos
- Loading states elegantes (skeleton cards)
- Manejo de errores con retry
- Layout responsive automático

## 🛠️ Tecnologías

### Frontend
- **HTML5** - Estructura semántica
- **CSS3** - Diseño moderno
  - CSS Grid y Flexbox
  - Variables CSS para temas
  - Animaciones suaves
  - Media queries responsive

- **JavaScript (Vanilla)**
  - Fetch API para datos
  - Gráficos SVG dinámicos
  - Cache local en memoria
  - Event delegation eficiente
  - Prefetch de países en background

### APIs Externas
- **World Bank (anual)** - Indicador FP.CPI.TOTL.ZG
- **INDEC / datos.gob.ar (mensual)** - Serie 145.3_INGNACUAL_DICI_M_38

### Características Técnicas
- Cálculo de inflación compuesta (no suma simple)
- Timeout de 2s para prefetch de datos
- Cache inteligente por país y modo (`{CODE}-{mode}`)
- Manejo de errores y fallback
- Formatos dinámicos (porcentajes, monedas, deltas)

## 📁 Estructura de Carpetas

```
inflation-dashboard/
├── index.html          # HTML principal
├── app.js              # Lógica, APIs y interactions
├── styles.css          # Todos los estilos
├── README.md           # Este archivo
└── data/
    └── inflacion.json  # Datos base y catálogo de países
```

## 🚀 Cómo Usar

### 1. Abrir Localmente

**Opción 1 - Archivo directo:**
```bash
# Simplemente abre index.html en tu navegador
# (Nota: algunas APIs requieren CORS, puede no funcionar localmente)
```

**Opción 2 - Servidor local (recomendado):**
```bash
# Python 3
python -m http.server 5500

# Node.js (con http-server instalado)
npx http-server -p 5500

# Luego abre en navegador
# http://localhost:5500
```

### 2. Personalización Básica

**En `index.html`:**
- Edita el título en `<title>`
- Cambia descripciones de Open Graph (og:*)
- Personaliza el título y subtítulo en hero

**Fuentes y colores en `styles.css`:**
```css
:root {
    --accent: #2c6fbb;      /* Principal - Azul actual */
    --accent-2: #1f9e89;    /* Secundario - Verde */
    --bg: #eef2f7;          /* Fondo claro */
    /* Cambia estos para tu marca */
}
```

### 3. Agregar Más Países

En `data/inflacion.json`, agregar en el catálogo:
```json
{
  "code": "AR",
  "name": "Argentina",
  "currency": "ARS"
}
```

En `app.js`, en `COUNTRY_CATALOG`:
```javascript
{ code: "XX", name: "Tu País", currency: "XXX" }
```

### 4. Cambiar Fuentes de Datos

En `app.js`:

**Para World Bank (anual):**
- Función `fetchWorldBankData(countryCode)`
- Indicador actual: `FP.CPI.TOTL.ZG`
- Documentación: https://data.worldbank.org

**Para INDEC Argentina (mensual):**
- Función `fetchINDECData()`
- Serie actual: `145.3_INGNACUAL_DICI_M_38`
- Documentación: https://datos.gob.ar

## 🔧 Configuración Avanzada

### Cache y Prefetch
```javascript
const inflationCache = new Map();  // Cache local
const prefetchStatus = new Map();  // Status de precarga
```

### Modos de Datos
- `anual` - Datos anuales desde World Bank
- `mensual` - Datos mensuales Argentina (solo disponible si País A = AR)

### Cálculos
- **Inflación acumulada:** Usa fórmula compuesta (multiplicación de factores)
- **Promedio:** Media aritmética de los períodos
- **Delta:** Diferencia con período anterior
- **Poder adquisitivo:** Inversa del acumulado desde período especificado

## 📱 Responsive

**Desktop (1200px+)**
- Grid con espaciado óptimo
- Gráfico con dimensiones amplias
- Dos columnas donde aplica

**Tablet (769px - 1199px)**
- Ajustes de espaciado
- Grid reflow automático
- Selectores adaptativos

**Mobile (480px - 768px)**
- Stack vertical de secciones
- Selectores full-width
- Tabla con scroll horizontal

**Small Mobile (<480px)**
- Ultra compacto
- Fuentes optimizadas
- Espaciado reducido

## 💡 Tips Profesionales

✅ **Haz:**
- Verifica regularmente que las APIs sigan funcionando
- Mantén los datos de catálogo actualizados
- Documenta cambios en fuentes de datos
- Testea con diferentes navegadores
- Considera agregar Analytics (opcional)

❌ **Evita:**
- Hardcodear datos (usa APIs siempre)
- Olvidar manejar errores de API
- Dejar URLs rotas en comentarios
- Cambiar variable de cache sin consistencia
- Ignorar warnings de CORS

## ⚡ Performance

- No usa librerías pesadas (Vanilla JS)
- Gráficos SVG vs Canvas pesado
- Cache local evita re-peticiones
- Prefetch asincrónico sin bloqueo
- Animaciones optimizadas (GPU)
- Load times <2s en conexión normal

## 🔒 Seguridad

✅ Este dashboard:
- No recolecta datos personales
- No hace tracking
- Solo usa APIs públicas
- HTML/CSS/JS vanilla
- CORS-safe para APIs externas

## 📊 Próximos Pasos

1. **Agregar más países** - Expande catálogo
2. **Datos históricos** - Guardar en JSON local
3. **Export de data** - CSV o gráficos
4. **Filtros avanzados** - Por región, rango de fechas
5. **PWA** - Funciona offline con service workers

## 📝 Licencia

Uso libre y personal. Puedes modificar y distribuir.

---

**Creado:** Febrero 2026  
**Versión:** 1.0

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