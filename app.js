const countrySelect = document.getElementById("countrySelect");
const metrics = document.getElementById("metrics");
const historyBody = document.getElementById("historyBody");
const periodLabel = document.getElementById("periodLabel");
const lastUpdated = document.getElementById("last-updated");
const chart = document.getElementById("trendChart");
const simulatorInput = document.getElementById("simAmount");
const simulatorResult = document.getElementById("simResult");
const simulatorReset = document.getElementById("simReset");

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

function formatMonthLabel(iso) {
  const [year, month] = iso.split("-");
  const idx = Math.max(0, Math.min(11, Number(month) - 1));
  return `${monthLabels[idx]} ${year}`;
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
      label: "Ultimo mes",
      value: formatPercent(latest.value),
      note: formatMonthLabel(latest.month),
      trend: trend.hasData ? { label: trend.label, className: trend.className } : null
    },
    { label: "Inflacion 12 meses", value: formatPercent(cumulative), note: "Acumulado" },
    { label: "Promedio 12m", value: formatPercent(average), note: "Media simple" }
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

function renderTable(country) {
  historyBody.innerHTML = "";
  const series = [...country.series].reverse();
  series.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${formatMonthLabel(item.month)}</td>
      <td>${formatPercent(item.value)}</td>
    `;
    historyBody.appendChild(row);
  });

  const first = country.series[0];
  const last = country.series[country.series.length - 1];
  periodLabel.textContent = `Periodo: ${formatMonthLabel(first.month)} - ${formatMonthLabel(last.month)}`;
  lastUpdated.textContent = `Actualizado: ${formatMonthLabel(last.month)}`;
}

function renderChart(country) {
  while (chart.firstChild) {
    chart.removeChild(chart.firstChild);
  }

  const width = 600;
  const height = 220;
  const padding = 24;
  const series = country.series;
  const trend = getTrendInfo(series);
  const values = series.map((item) => item.value);
  const max = Math.max(...values) * 1.1;
  const min = Math.max(0, Math.min(...values) * 0.8);

  const scaleX = (index) =>
    padding + (index / (series.length - 1)) * (width - padding * 2);
  const scaleY = (value) =>
    height - padding - ((value - min) / (max - min || 1)) * (height - padding * 2);

  const points = series.map((item, idx) => [scaleX(idx), scaleY(item.value)]);

  const areaPath = [
    `M ${points[0][0]} ${height - padding}`,
    ...points.map((point) => `L ${point[0]} ${point[1]}`),
    `L ${points[points.length - 1][0]} ${height - padding}`,
    "Z"
  ].join(" ");

  const linePath = [
    `M ${points[0][0]} ${points[0][1]}`,
    ...points.slice(1).map((point) => `L ${point[0]} ${point[1]}`)
  ].join(" ");

  const area = document.createElementNS("http://www.w3.org/2000/svg", "path");
  area.setAttribute("d", areaPath);
  area.setAttribute("fill", "rgba(44, 111, 187, 0.12)");

  const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
  line.setAttribute("d", linePath);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#2c6fbb");
  line.setAttribute("stroke-width", "3");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.classList.add("chart-line");

  const lastPoint = points[points.length - 1];
  const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  dot.setAttribute("cx", lastPoint[0]);
  dot.setAttribute("cy", lastPoint[1]);
  dot.setAttribute("r", "5");
  dot.setAttribute("fill", "#2c6fbb");

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
  chart.appendChild(dot);

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

  const length = line.getTotalLength();
  line.style.strokeDasharray = `${length}`;
  line.style.strokeDashoffset = `${length}`;
  requestAnimationFrame(() => {
    line.style.strokeDashoffset = "0";
  });
}

function updateSimulator(country) {
  if (!country || !simulatorInput || !simulatorResult) {
    return;
  }

  const rawValue = Number(simulatorInput.value);
  const base = Number.isFinite(rawValue) && rawValue > 0 ? rawValue : 0;
  const cumulative = cumulativeInflation(country.series);
  const adjusted = base * (1 + cumulative / 100);
  const currency = country.currency || "ARS";
  const baseLabel = formatCurrency(base, currency);
  const adjustedLabel = base > 0 ? formatCurrency(adjusted, currency) : "--";

  simulatorResult.textContent = `Si ganabas ${baseLabel} hace 12 meses, hoy necesitarias ${adjustedLabel}`;
}

function setLegendName(name) {
  const legend = document.querySelector(".legend span:last-child");
  if (legend) {
    legend.textContent = name;
  }
}

function init(data) {
  countrySelect.innerHTML = "";
  let activeCountry = null;
  data.countries.forEach((country, index) => {
    const option = document.createElement("option");
    option.value = country.code;
    option.textContent = country.name;
    if (index === 0) {
      option.selected = true;
    }
    countrySelect.appendChild(option);
  });

  function renderSelected() {
    const selected = data.countries.find((item) => item.code === countrySelect.value);
    if (!selected) {
      return;
    }
    activeCountry = selected;
    renderMetrics(selected);
    renderChart(selected);
    renderTable(selected);
    setLegendName(selected.name);
    updateSimulator(selected);
  }

  countrySelect.addEventListener("change", renderSelected);
  if (simulatorInput) {
    simulatorInput.addEventListener("input", () => updateSimulator(activeCountry));
  }
  if (simulatorReset && simulatorInput) {
    simulatorReset.addEventListener("click", () => {
      simulatorInput.value = "100000";
      updateSimulator(activeCountry);
    });
  }
  renderSelected();
}

fetch("data/inflacion.json")
  .then((response) => response.json())
  .then((data) => init(data))
  .catch(() => {
    metrics.innerHTML = "<div class=\"card\"><small>Sin datos</small><h3>--</h3><small>Revisar JSON</small></div>";
  });
