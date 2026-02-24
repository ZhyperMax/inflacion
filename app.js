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
const simulatorInput = document.getElementById("simAmount");
const simulatorResult = document.getElementById("simResult");
const simulatorResultB = document.getElementById("simResultB");
const simulatorReset = document.getElementById("simReset");
const simulatorMonths = document.getElementById("simMonths");

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

function formatPeriodLabel(value) {
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split("-");
    const idx = Math.max(0, Math.min(11, Number(month) - 1));
    return `${monthLabels[idx]} ${year}`;
  }
  if (/^\d{4}$/.test(value)) {
    return value;
  }
  return value;
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

  const items = [
    {
      label: "Ultimo anio",
      value: formatPercent(latest.value),
      note: formatPeriodLabel(latest.month),
      trend: trend.hasData ? { label: trend.label, className: trend.className } : null
    },
    { label: "Inflacion 12 anios", value: formatPercent(cumulative), note: "Acumulado" },
    { label: "Promedio 12a", value: formatPercent(average), note: "Media simple" }
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
      <td>${formatPeriodLabel(item.month)}</td>
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
        <td>${formatPeriodLabel(item.month)}</td>
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
  periodLabel.textContent = `Periodo: ${formatPeriodLabel(first.month)} - ${formatPeriodLabel(last.month)}`;
  lastUpdated.textContent = `Actualizado: ${formatPeriodLabel(last.month)}`;
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

  simulatorResult.textContent = `Si ganabas ${baseLabel} hace ${months} anios, hoy necesitarias ${adjustedLabel}`;

  if (simulatorResultB) {
    if (!secondary) {
      simulatorResultB.classList.add("is-hidden");
      return;
    }

    const monthsB = Math.max(1, Math.min(secondary.series.length, requestedMonths || 12));
    const seriesSliceB = secondary.series.slice(-monthsB);
    const cumulativeB = cumulativeInflation(seriesSliceB);
    const adjustedB = base * (1 + cumulativeB / 100);
    const currencyB = secondary.currency || "ARS";
    const baseLabelB = formatCurrency(base, currencyB);
    const adjustedLabelB = base > 0 ? formatCurrency(adjustedB, currencyB) : "--";

    simulatorResultB.textContent = `Si ganabas ${baseLabelB} hace ${monthsB} anios, hoy necesitarias ${adjustedLabelB}`;
    simulatorResultB.classList.remove("is-hidden");
  }
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

  const filtered = rows.filter((row) => row.value !== null);
  const trimmed = filtered.slice(0, 12).reverse();
  return trimmed.map((row) => ({
    month: String(row.date),
    value: Number(row.value)
  }));
}

async function loadCountryData(code) {
  if (inflationCache.has(code)) {
    return inflationCache.get(code);
  }
  const meta = COUNTRY_CATALOG.find((item) => item.code === code);
  if (!meta) {
    return null;
  }
  const series = await fetchInflationSeries(code);
  const result = { ...meta, series };
  inflationCache.set(code, result);
  return result;
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
  COUNTRY_CATALOG.forEach((country, index) => {
    const option = document.createElement("option");
    option.value = country.code;
    option.textContent = country.name;
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
      countrySelectB.appendChild(option);
    });
  }

  async function renderSelected() {
    const selectedCode = countrySelect.value;
    if (!selectedCode) {
      return;
    }

    try {
      activeCountry = await loadCountryData(selectedCode);
      if (countrySelectB && !countrySelectB.disabled && countrySelectB.value) {
        activeCountryB = await loadCountryData(countrySelectB.value);
      } else {
        activeCountryB = null;
      }
    } catch (error) {
      metrics.innerHTML = "<div class=\"card\"><small>Sin datos</small><h3>--</h3><small>Revisar API</small></div>";
      return;
    }

    if (!activeCountry || !activeCountry.series.length) {
      metrics.innerHTML = "<div class=\"card\"><small>Sin datos</small><h3>--</h3><small>Serie vacia</small></div>";
      return;
    }

    renderMetrics(activeCountry);
    renderChart(activeCountry, activeCountryB);
    renderTable(activeCountry, activeCountryB);
    setLegendNames(activeCountry, activeCountryB);
    updateCompareDiff(activeCountry, activeCountryB);
    updateSimulator(activeCountry, activeCountryB);
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
  renderSelected();
}

init();
