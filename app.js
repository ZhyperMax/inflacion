const countrySelect = document.getElementById("countrySelect");
const countrySelectB = document.getElementById("countrySelectB");
const metrics = document.getElementById("metrics");
const historyBody = document.getElementById("historyBody");
const historyBodyB = document.getElementById("historyBodyB");
const historyTitleA = document.getElementById("historyTitleA");
const historyTitleB = document.getElementById("historyTitleB");
const historyCardB = document.getElementById("historyCardB");
const periodLabel = document.getElementById("periodLabel");
const lastUpdated = document.getElementById("last-updated");
const chart = document.getElementById("trendChart");
const legendA = document.getElementById("legendA");
const legendB = document.getElementById("legendB");
const legendBItem = document.getElementById("legendBItem");
const compareDiff = document.getElementById("compareDiff");
const metricsToggle = document.getElementById("metricsToggle");
const metricsBtnA = document.getElementById("metricsBtnA");
const metricsBtnB = document.getElementById("metricsBtnB");
const metricsTitle = document.getElementById("metricsTitle");
const apiNotice = document.getElementById("apiNotice");
const apiRetry = document.getElementById("apiRetry");
const loadingState = document.getElementById("loadingState");
const prefetchState = document.getElementById("prefetchState");
const metricsSkeleton = document.getElementById("metricsSkeleton");
const simulatorInput = document.getElementById("simAmount");
const simulatorResult = document.getElementById("simResult");
const simulatorResultB = document.getElementById("simResultB");
const simulatorReset = document.getElementById("simReset");
const simulatorMonths = document.getElementById("simMonths");
const periodToggle = document.getElementById("periodToggle");
const periodBtnAnual = document.getElementById("periodBtnAnual");
const periodBtnMensual = document.getElementById("periodBtnMensual");
const chartTitle = document.getElementById("chartTitle");
const chartSubtitle = document.getElementById("chartSubtitle");
const historyTitle = document.getElementById("historyTitle");
const historySubtitle = document.getElementById("historySubtitle");
const simLabel = document.getElementById("simLabel");
const simSubtitle = document.getElementById("simSubtitle");

const chartColors = {
  primary: "#2c6fbb",
  secondary: "#1f9e89"
};

const COUNTRY_CATALOG = [
  { code: "AR", name: "Argentina", currency: "ARS" },
  { code: "CL", name: "Chile", currency: "CLP" },
  { code: "BR", name: "Brasil", currency: "BRL" },
  { code: "MX", name: "Mexico", currency: "MXN" },
  { code: "CO", name: "Colombia", currency: "COP" },
  { code: "PE", name: "Peru", currency: "PEN" },
  { code: "UY", name: "Uruguay", currency: "UYU" },
  { code: "PY", name: "Paraguay", currency: "PYG" }
];

const inflationCache = new Map();
const prefetchStatus = new Map();
let metricsView = "A";
let periodMode = "anual";

const monthLabels = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
];

function formatPercent(value) {
  return `${value.toFixed(1).replace(".", ",")}%`;
}

function formatDelta(value) {
  const sign = value > 0 ? "+" : value < 0 ? "" : "";
  return `${sign}${value.toFixed(1).replace(".", ",")} pp`;
}

function formatPeriodLabel(period) {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    const idx = Math.max(0, Math.min(11, Number(month) - 1));
    return `${monthLabels[idx]} ${year}`;
  }
  if (/^\d{4}$/.test(period)) {
    return period;
  }
  return period;
}

function cumulativeInflation(series) {
  const factor = series.reduce((acc, item) => acc * (1 + item.value / 100), 1);
  return (factor - 1) * 100;
}

function averageInflation(series) {
  const sum = series.reduce((acc, item) => acc + item.value, 0);
  return sum / series.length;
}

function formatCurrency(value, currency) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function getTrendInfo(series) {
  if (series.length < 2) {
    return { hasData: false, delta: 0, className: "trend-flat", label: "→ 0,0 pp" };
  }

  const latest = series[series.length - 1];
  const prev = series[series.length - 2];
  const delta = latest.value - prev.value;
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  const className = delta > 0 ? "trend-up" : delta < 0 ? "trend-down" : "trend-flat";
  const label = `${arrow} ${delta > 0 ? "+" : ""}${delta
    .toFixed(1)
    .replace(".", ",")} pp`;

  return { hasData: true, delta, className, label };
}

function renderMetrics(country) {
  const latest = country.series[country.series.length - 1];
  const cumulative = cumulativeInflation(country.series);
  const average = averageInflation(country.series);
  const trend = getTrendInfo(country.series);
  metrics.innerHTML = "";
  
  const isMensual = country.mode === "mensual";
  const periodLabel = isMensual ? "mes" : "anio";
  const periodPluralLabel = isMensual ? "meses" : "anios";
  const cumulativeLabel = isMensual ? "12 meses" : "12 anios";
  const averageLabel = isMensual ? "Promedio 12m" : "Promedio 12a";

  const items = [
    {
      label: `Ultimo ${periodLabel}`,
      value: formatPercent(latest.value),
      note: formatPeriodLabel(latest.period),
      trend: trend.hasData ? { label: trend.label, className: trend.className } : null
    },
    { label: `Inflacion ${cumulativeLabel}`, value: formatPercent(cumulative), note: "Acumulado" },
    { label: averageLabel, value: formatPercent(average), note: "Media simple" }
  ];

  items.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "card";
    card.style.animationDelay = `${index * 90}ms`;
    card.innerHTML = `
      <small>${item.label}</small>
      <h3>${item.value}</h3>
      <small>${item.note}</small>
      ${
        item.trend
          ? `<div class="trend-badge ${item.trend.className}">${item.trend.label}</div>`
          : ""
      }
    `;
    metrics.appendChild(card);
  });
}

function renderMetricsByView(primary, secondary) {
  const target = metricsView === "B" && secondary ? secondary : primary;
  if (!target) {
    return;
  }
  metricsView = target === primary ? "A" : "B";
  renderMetrics(target);
  if (metricsTitle) {
    metricsTitle.textContent = `Resumen: ${target.name}`;
  }
  if (metricsBtnA) {
    metricsBtnA.classList.toggle("is-active", metricsView === "A");
  }
  if (metricsBtnB) {
    metricsBtnB.classList.toggle("is-active", metricsView === "B");
  }
}

function updateMetricsToggle(primary, secondary) {
  if (!metricsToggle || !metricsBtnA || !metricsBtnB) {
    renderMetricsByView(primary, secondary);
    return;
  }

  if (secondary) {
    metricsToggle.classList.remove("is-hidden");
    metricsBtnA.textContent = primary.name;
    metricsBtnB.textContent = secondary.name;
  } else {
    metricsToggle.classList.add("is-hidden");
    metricsView = "A";
  }

  renderMetricsByView(primary, secondary);
}

function updateApiNotice(primary) {
  if (!apiNotice) {
    return;
  }
  const show = !primary || !primary.series || primary.series.length === 0;
  apiNotice.classList.toggle("is-hidden", !show);
}

function updateUITexts() {
  const isMensual = periodMode === "mensual";
  const periodLabel = isMensual ? "meses" : "anios";
  const periodSingular = isMensual ? "mes" : "anio";
  
  if (chartTitle) {
    chartTitle.textContent = `Trayectoria 12 ${periodLabel}`;
  }
  if (chartSubtitle) {
    chartSubtitle.textContent = isMensual ? "Variacion mensual en porcentaje" : "Variacion anual en porcentaje";
  }
  if (historyTitle) {
    historyTitle.textContent = isMensual ? "Historial mensual" : "Historial anual";
  }
  if (historySubtitle) {
    historySubtitle.textContent = `Ultimos 12 ${periodLabel} disponibles`;
  }
  if (simLabel) {
    simLabel.textContent = `Monto hace 12 ${periodLabel}`;
  }
  if (simSubtitle) {
    simSubtitle.textContent = "Calcula cuanto necesitarias hoy para mantener el mismo poder de compra.";
  }
  
  if (simulatorMonths) {
    const currentValue = simulatorMonths.value;
    simulatorMonths.innerHTML = `
      <option value="3">3 ${periodLabel}</option>
      <option value="6">6 ${periodLabel}</option>
      <option value="12">12 ${periodLabel}</option>
    `;
    simulatorMonths.value = currentValue;
  }
}

function updatePeriodToggleVisibility(selectedCode) {
  if (!periodToggle) return;
  
  const showToggle = selectedCode === "AR";
  periodToggle.classList.toggle("is-hidden", !showToggle);
  
  if (!showToggle && periodMode === "mensual") {
    periodMode = "anual";
    periodBtnAnual.classList.add("is-active");
    periodBtnMensual.classList.remove("is-active");
    updateUITexts();
  }
}

function setLoading(isLoading) {
  if (!loadingState) {
    return;
  }
  loadingState.classList.toggle("is-hidden", !isLoading);
  if (metricsSkeleton) {
    metricsSkeleton.classList.toggle("is-hidden", !isLoading);
  }
  if (metrics) {
    metrics.classList.toggle("is-hidden", isLoading);
  }
}

function renderTable(country, secondary) {
  if (historyBody) {
    historyBody.innerHTML = "";
  }
  if (historyBodyB) {
    historyBodyB.innerHTML = "";
  }

  const series = [...country.series].reverse();
  series.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatPeriodLabel(item.period)}</td>
      <td>${formatPercent(item.value)}</td>
    `;
    historyBody.appendChild(row);
  });

  if (historyTitleA) {
    historyTitleA.textContent = country.name;
  }

  if (secondary && historyBodyB) {
    const seriesB = [...secondary.series].reverse();
    seriesB.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${formatPeriodLabel(item.period)}</td>
        <td>${formatPercent(item.value)}</td>
      `;
      historyBodyB.appendChild(row);
    });
  }

  if (historyTitleB) {
    historyTitleB.textContent = secondary ? secondary.name : "Pais B";
  }
  if (historyCardB) {
    historyCardB.classList.toggle("is-hidden", !secondary);
  }

  const first = country.series[0];
  const last = country.series[country.series.length - 1];
  periodLabel.textContent = `Periodo: ${formatPeriodLabel(first.period)} - ${formatPeriodLabel(last.period)}`;
  lastUpdated.textContent = `Actualizado: ${formatPeriodLabel(last.period)}`;
}

function renderChart(primary, secondary) {
  while (chart.firstChild) {
    chart.removeChild(chart.firstChild);
  }

  const width = 600;
  const height = 220;
  const padding = 24;
  const primarySeries = primary.series;
  const trend = getTrendInfo(primarySeries);
  const compareEnabled = Boolean(secondary);
  const length = compareEnabled
    ? Math.min(primarySeries.length, secondary.series.length)
    : primarySeries.length;
  if (length === 0) {
    return;
  }
  const seriesA = primarySeries.slice(-length);
  const seriesB = compareEnabled ? secondary.series.slice(-length) : null;
  const values = seriesB
    ? [...seriesA.map((item) => item.value), ...seriesB.map((item) => item.value)]
    : seriesA.map((item) => item.value);
  const max = Math.max(...values) * 1.1;
  const min = Math.max(0, Math.min(...values) * 0.8);
  const divisor = Math.max(1, length - 1);

  const scaleX = (index) =>
    padding + (index / divisor) * (width - padding * 2);
  const scaleY = (value) =>
    height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);

  const pointsA = seriesA.map((item, idx) => [scaleX(idx), scaleY(item.value)]);
  const pointsB = seriesB
    ? seriesB.map((item, idx) => [scaleX(idx), scaleY(item.value)])
    : null;

  const areaPath = [
    `M ${pointsA[0][0]} ${height - padding}`,
    ...pointsA.map((point) => `L ${point[0]} ${point[1]}`),
    `L ${pointsA[pointsA.length - 1][0]} ${height - padding}`,
    "Z"
  ].join(" ");

  const linePath = [
    `M ${pointsA[0][0]} ${pointsA[0][1]}`,
    ...pointsA.slice(1).map((point) => `L ${point[0]} ${point[1]}`)
  ].join(" ");

  const linePathB = pointsB
    ? [
        `M ${pointsB[0][0]} ${pointsB[0][1]}`,
        ...pointsB.slice(1).map((point) => `L ${point[0]} ${point[1]}`)
      ].join(" ")
    : null;

  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", areaPath);
  area.setAttribute("fill", "rgba(44, 111, 187, 0.12)");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", linePath);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", chartColors.primary);
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.classList.add("chart-line");

  const lineB = linePathB
    ? document.createElementNS("http://www.w3.org/2000/svg", "path")
    : null;
  if (lineB) {
    lineB.setAttribute("d", linePathB);
    lineB.setAttribute("fill", "none");
    lineB.setAttribute("stroke", chartColors.secondary);
    lineB.setAttribute("stroke-width", "2.5");
    lineB.setAttribute("stroke-linecap", "round");
    lineB.setAttribute("stroke-linejoin", "round");
    lineB.classList.add("chart-line");
  }

  const lastPoint = pointsA[pointsA.length - 1];
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", lastPoint[0]);
  dot.setAttribute("cy", lastPoint[1]);
  dot.setAttribute("r", "5");
  dot.setAttribute("fill", chartColors.primary);

  const dotB = pointsB
    ? document.createElementNS("http://www.w3.org/2000/svg", "circle")
    : null;
  if (dotB) {
    const lastPointB = pointsB[pointsB.length - 1];
    dotB.setAttribute("cx", lastPointB[0]);
    dotB.setAttribute("cy", lastPointB[1]);
    dotB.setAttribute("r", "4");
    dotB.setAttribute("fill", chartColors.secondary);
  }

  const grid = document.createElementNS("http://www.w3.org/2000/svg", "line");
  grid.setAttribute("x1", padding);
  grid.setAttribute("x2", width - padding);
  grid.setAttribute("y1", height - padding);
  grid.setAttribute("y2", height - padding);
  grid.setAttribute("stroke", "#d9e1ec");
  grid.setAttribute("stroke-width", "1");

  chart.appendChild(grid);
  chart.appendChild(area);
  chart.appendChild(line);
  if (lineB) {
    chart.appendChild(lineB);
  }
  chart.appendChild(dot);
  if (dotB) {
    chart.appendChild(dotB);
  }

  if (trend.hasData) {
    const labelGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const labelBg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const labelText = document.createElementNS("http://www.w3.org/2000/svg", "text");

    labelText.textContent = trend.label;
    labelText.setAttribute("class", `chart-label ${trend.className}`);
    labelText.setAttribute("x", lastPoint[0] + 12);
    labelText.setAttribute("y", Math.max(padding, lastPoint[1] - 18));
    labelText.setAttribute("dominant-baseline", "middle");
    labelText.setAttribute("font-family", "IBM Plex Sans, Arial, sans-serif");

    labelBg.setAttribute("class", `chart-label-bg ${trend.className}`);
    labelBg.setAttribute("rx", "999");
    labelBg.setAttribute("ry", "999");

    labelGroup.appendChild(labelBg);
    labelGroup.appendChild(labelText);
    chart.appendChild(labelGroup);

    const bbox = labelText.getBBox();
    const pad = 6;
    let dx = 0;
    let dy = 0;
    const overflowRight = bbox.x + bbox.width + pad - (width - padding);
    const overflowLeft = padding - (bbox.x - pad);
    const overflowTop = padding - (bbox.y - pad);

    if (overflowRight > 0) {
      dx -= overflowRight;
    }
    if (overflowLeft > 0) {
      dx += overflowLeft;
    }
    if (overflowTop > 0) {
      dy += overflowTop;
    }

    if (dx !== 0 || dy !== 0) {
      labelGroup.setAttribute("transform", `translate(${dx} ${dy})`);
    }

    labelBg.setAttribute("x", bbox.x - pad);
    labelBg.setAttribute("y", bbox.y - pad);
    labelBg.setAttribute("width", bbox.width + pad * 2);
    labelBg.setAttribute("height", bbox.height + pad * 2);
  }

  const lengthA = line.getTotalLength();
  line.style.strokeDasharray = `${lengthA}`;
  line.style.strokeDashoffset = `${lengthA}`;

  if (lineB) {
    const lengthB = lineB.getTotalLength();
    lineB.style.strokeDasharray = `${lengthB}`;
    lineB.style.strokeDashoffset = `${lengthB}`;
  }

  requestAnimationFrame(() => {
    line.style.strokeDashoffset = "0";
    if (lineB) {
      lineB.style.strokeDashoffset = "0";
    }
  });
}

function updateSimulator(country, secondary) {
  if (!country || !simulatorInput || !simulatorResult) {
    return;
  }

  const isMensual = country.mode === "mensual";
  const periodLabel = isMensual ? "meses" : "anios";
  
  const rawValue = Number(simulatorInput.value);
  const base = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
  const requestedMonths = simulatorMonths ? Number(simulatorMonths.value) : 12;
  const months = Math.max(1, Math.min(country.series.length, requestedMonths || 12));
  const seriesSlice = country.series.slice(-months);
  const cumulative = cumulativeInflation(seriesSlice);
  const adjusted = base * (1 + cumulative / 100);
  const currency = country.currency || "ARS";
  const baseLabel = formatCurrency(base, currency);
  const adjustedLabel = base > 0 ? formatCurrency(adjusted, currency) : "--";

  simulatorResult.textContent = `Si ganabas ${baseLabel} hace ${months} ${periodLabel}, hoy necesitarias ${adjustedLabel}`;

  if (simulatorResultB) {
    if (!secondary) {
      simulatorResultB.classList.add("is-hidden");
      return;
    }

    const isMensualB = secondary.mode === "mensual";
    const periodLabelB = isMensualB ? "meses" : "anios";
    
    const monthsB = Math.max(1, Math.min(secondary.series.length, requestedMonths || 12));
    const seriesSliceB = secondary.series.slice(-monthsB);
    const cumulativeB = cumulativeInflation(seriesSliceB);
    const adjustedB = base * (1 + cumulativeB / 100);
    const currencyB = secondary.currency || "ARS";
    const baseLabelB = formatCurrency(base, currencyB);
    const adjustedLabelB = base > 0 ? formatCurrency(adjustedB, currencyB) : "--";

    simulatorResultB.textContent = `Si ganabas ${baseLabelB} hace ${monthsB} ${periodLabelB}, hoy necesitarias ${adjustedLabelB}`;
    simulatorResultB.classList.remove("is-hidden");
  }
}

async function fetchMonthlyInflationAR() {
  const seriesId = "103.1_I2N_2016_M_15";
  const url = `https://apis.datos.gob.ar/series/api/series?ids=${seriesId}:percent_change_a_year_ago&last=12`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la serie mensual");
  }
  const payload = await response.json();
  if (!payload.data || payload.data.length === 0) {
    return [];
  }
  
  return payload.data.map(row => ({
    period: row[0],
    value: row[1] !== null ? Number(row[1]) : 0
  }));
}

async function fetchInflationSeries(code) {
  const indicator = "FP.CPI.TOTL.ZG";
  const url = `https://api.worldbank.org/v2/country/${code}/indicator/${indicator}?format=json&per_page=60`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("No se pudo cargar la serie");
  }
  const payload = await response.json();
  const rows = Array.isArray(payload) ? payload[1] : null;
  if (!Array.isArray(rows)) {
    return [];
  }

  const filtered = rows
    .filter((row) => row.value !== null)
    .sort((a, b) => Number(a.date) - Number(b.date));
  const trimmed = filtered.slice(-12);
  return trimmed.map((row) => ({
    period: String(row.date),
    value: Number(row.value)
  }));
}

function updateOptionStatus(code, status) {
  const selectors = [countrySelect, countrySelectB].filter(Boolean);
  selectors.forEach((select) => {
    const option = Array.from(select.options).find((item) => item.value === code);
    if (!option) {
      return;
    }
    const baseLabel = option.dataset.label || option.textContent.replace(" (pendiente)", "");
    option.dataset.label = baseLabel;
    option.textContent = status === "pending" ? `${baseLabel} (pendiente)` : baseLabel;
  });
}

async function loadCountryData(code) {
  const cacheKey = `${code}-${periodMode}`;
  if (inflationCache.has(cacheKey)) {
    return inflationCache.get(cacheKey);
  }
  const meta = COUNTRY_CATALOG.find((item) => item.code === code);
  if (!meta) {
    return null;
  }
  
  let series;
  if (code === "AR" && periodMode === "mensual") {
    series = await fetchMonthlyInflationAR();
  } else {
    series = await fetchInflationSeries(code);
  }
  
  const result = { ...meta, series, mode: periodMode };
  inflationCache.set(cacheKey, result);
  
  // Limpiar estado pendiente si existe
  if (prefetchStatus.has(code)) {
    prefetchStatus.set(code, "ready");
    updateOptionStatus(code, "ready");
  }
  
  return result;
}

function prefetchAllCountries() {
  if (prefetchState) {
    prefetchState.classList.remove("is-hidden");
  }
  const total = COUNTRY_CATALOG.length;
  let completed = 0;

  const updateProgress = () => {
    if (!prefetchState) {
      return;
    }
    prefetchState.textContent = `Precargando ${completed}/${total}`;
  };

  const withTimeout = (promise, ms) =>
    Promise.race([
      promise,
      new Promise((resolve) => {
        setTimeout(() => resolve(null), ms);
      })
    ]);

  updateProgress();

  (async () => {
    // Guardar el modo actual y forzar a anual para el prefetch
    const originalMode = periodMode;
    periodMode = "anual";
    
    for (const country of COUNTRY_CATALOG) {
      const data = await withTimeout(loadCountryData(country.code), 2000).catch(() => null);
      const ok = data && Array.isArray(data.series) && data.series.length > 0;
      prefetchStatus.set(country.code, ok ? "ready" : "pending");
      updateOptionStatus(country.code, ok ? "ready" : "pending");
      completed += 1;
      updateProgress();
    }
    
    // Restaurar el modo original
    periodMode = originalMode;
    
    if (prefetchState) {
      prefetchState.classList.add("is-hidden");
    }
  })();
}

function setLegendNames(primary, secondary) {
  if (legendA) {
    legendA.textContent = primary ? primary.name : "-";
  }
  if (legendB) {
    legendB.textContent = secondary ? secondary.name : "Comparador";
  }
  if (legendBItem) {
    legendBItem.classList.toggle("is-hidden", !secondary);
  }
}

function updateCompareDiff(primary, secondary) {
  if (!compareDiff) {
    return;
  }
  if (!primary || !secondary) {
    compareDiff.textContent = "Diferencia acumulada: --";
    compareDiff.classList.add("is-hidden");
    return;
  }

  const length = Math.min(primary.series.length, secondary.series.length);
  const seriesA = primary.series.slice(-length);
  const seriesB = secondary.series.slice(-length);
  const cumulativeA = cumulativeInflation(seriesA);
  const cumulativeB = cumulativeInflation(seriesB);
  const diff = cumulativeA - cumulativeB;
  compareDiff.textContent = `Diferencia acumulada: ${formatDelta(diff)} (${primary.name} - ${secondary.name})`;
  compareDiff.classList.remove("is-hidden");
}

function init() {
  countrySelect.innerHTML = "";
  let activeCountry = null;
  let activeCountryB = null;
  
  updateUITexts();
  
  COUNTRY_CATALOG.forEach((country, index) => {
    const option = document.createElement("option");
    option.value = country.code;
    option.textContent = country.name;
    option.dataset.label = country.name;
    if (index === 0) {
      option.selected = true;
    }
    countrySelect.appendChild(option);
  });

  if (countrySelectB) {
    countrySelectB.innerHTML = "";
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Sin comparacion";
    emptyOption.selected = true;
    countrySelectB.appendChild(emptyOption);
    COUNTRY_CATALOG.forEach((country) => {
      const option = document.createElement("option");
      option.value = country.code;
      option.textContent = country.name;
      option.dataset.label = country.name;
      countrySelectB.appendChild(option);
    });
  }

  async function renderSelected(forceRefresh = false) {
    const selectedCode = countrySelect.value;
    if (!selectedCode) {
      setLoading(false);
      return;
    }
    
    updatePeriodToggleVisibility(selectedCode);

    setLoading(true);

    if (forceRefresh) {
      const cacheKeyA = `${selectedCode}-${periodMode}`;
      inflationCache.delete(cacheKeyA);
      if (countrySelectB && countrySelectB.value) {
        const cacheKeyB = `${countrySelectB.value}-${periodMode}`;
        inflationCache.delete(cacheKeyB);
      }
    }

    try {
      activeCountry = await loadCountryData(selectedCode);
      if (activeCountry && Array.isArray(activeCountry.series) && activeCountry.series.length > 0) {
        prefetchStatus.set(selectedCode, "ready");
        updateOptionStatus(selectedCode, "ready");
      }
      if (countrySelectB && !countrySelectB.disabled && countrySelectB.value) {
        activeCountryB = await loadCountryData(countrySelectB.value);
        if (activeCountryB && Array.isArray(activeCountryB.series) && activeCountryB.series.length > 0) {
          prefetchStatus.set(countrySelectB.value, "ready");
          updateOptionStatus(countrySelectB.value, "ready");
        }
      } else {
        activeCountryB = null;
      }
    } catch (error) {
      const fallback = COUNTRY_CATALOG.find((item) => item.code === selectedCode);
      if (fallback) {
        inflationCache.set(selectedCode, { ...fallback, series: [] });
      }
      if (countrySelectB && countrySelectB.value) {
        const fallbackB = COUNTRY_CATALOG.find((item) => item.code === countrySelectB.value);
        if (fallbackB) {
          inflationCache.set(countrySelectB.value, { ...fallbackB, series: [] });
        }
      }
      updateApiNotice(null);
      metrics.innerHTML = "<div class=\"card\"><small>Sin datos</small><h3>--</h3><small>Revisar API</small></div>";
      setLoading(false);
      return;
    }

    if (!activeCountry || !activeCountry.series.length) {
      updateApiNotice(activeCountry);
      metrics.innerHTML = "<div class=\"card\"><small>Sin datos</small><h3>--</h3><small>Serie vacia</small></div>";
      setLoading(false);
      return;
    }

    updateApiNotice(activeCountry);
    updateMetricsToggle(activeCountry, activeCountryB);
    renderChart(activeCountry, activeCountryB);
    renderTable(activeCountry, activeCountryB);
    setLegendNames(activeCountry, activeCountryB);
    updateCompareDiff(activeCountry, activeCountryB);
    updateSimulator(activeCountry, activeCountryB);
    setLoading(false);
  }

  countrySelect.addEventListener("change", renderSelected);
  if (countrySelectB) {
    const hasMultiple = COUNTRY_CATALOG.length > 1;
    countrySelectB.disabled = !hasMultiple;
    countrySelectB.addEventListener("change", renderSelected);
    if (!hasMultiple) {
      activeCountryB = null;
      setLegendNames(activeCountry, null);
    }
  }
  if (simulatorInput) {
    simulatorInput.addEventListener("input", () => updateSimulator(activeCountry, activeCountryB));
  }
  if (simulatorMonths) {
    simulatorMonths.addEventListener("change", () => updateSimulator(activeCountry, activeCountryB));
  }
  if (simulatorReset && simulatorInput) {
    simulatorReset.addEventListener("click", () => {
      simulatorInput.value = "100000";
      updateSimulator(activeCountry, activeCountryB);
    });
  }
  if (metricsBtnA) {
    metricsBtnA.addEventListener("click", () => {
      metricsView = "A";
      renderMetricsByView(activeCountry, activeCountryB);
    });
  }
  if (metricsBtnB) {
    metricsBtnB.addEventListener("click", () => {
      if (!activeCountryB) {
        return;
      }
      metricsView = "B";
      renderMetricsByView(activeCountry, activeCountryB);
    });
  }
  if (apiRetry) {
    apiRetry.addEventListener("click", () => {
      renderSelected(true);
    });
  }
  
  if (periodBtnAnual) {
    periodBtnAnual.addEventListener("click", () => {
      if (periodMode === "anual") return;
      periodMode = "anual";
      periodBtnAnual.classList.add("is-active");
      periodBtnMensual.classList.remove("is-active");
      inflationCache.clear();
      updateUITexts();
      renderSelected(true);
    });
  }
  
  if (periodBtnMensual) {
    periodBtnMensual.addEventListener("click", () => {
      if (periodMode === "mensual") return;
      const selectedCode = countrySelect.value;
      if (selectedCode !== "AR") {
        alert("Los datos mensuales solo están disponibles para Argentina. Por favor, selecciona Argentina en el selector de país A.");
        return;
      }
      periodMode = "mensual";
      periodBtnMensual.classList.add("is-active");
      periodBtnAnual.classList.remove("is-active");
      inflationCache.clear();
      updateUITexts();
      renderSelected(true);
    });
  }
  
  renderSelected();
  prefetchAllCountries();
}

init();
