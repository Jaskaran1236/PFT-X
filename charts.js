let allocationChart = null;
let monteChart = null;

// ── Portfolio Allocation ──────────────────────────────────────────
function drawAllocationChart(portfolio) {
  const ctx = document.getElementById("allocationChart");
  if (!ctx) return;

  // Only include positions where we have a live price
  const priced = portfolio.filter((s) => s.currentPrice !== null);

  if (priced.length === 0) {
    if (allocationChart) { allocationChart.destroy(); allocationChart = null; }
    return;
  }

  const labels = priced.map((s) => s.ticker);
  // Use current market value for accurate allocation weights
  const values = priced.map((s) => s.shares * s.currentPrice);

  const COLORS = [
    "#5a9dc8", "#3b82f6", "#00d97e", "#f04458", "#8b5cf6",
    "#06b6d4", "#7ab8d8", "#4ade80", "#e879a0", "#14b8a6",
  ];

  if (allocationChart) { allocationChart.destroy(); }

  allocationChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: COLORS.slice(0, labels.length),
        borderColor: "#020a16",
        borderWidth: 2,
        hoverOffset: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: {
            color: "#c8dff0",
            font: { family: "'JetBrains Mono',monospace", size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.parsed / total) * 100).toFixed(1);
              return ` ${ctx.label}: £${ctx.parsed.toFixed(2)} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

// ── Box-Muller normal variate ─────────────────────────────────────
function gaussRandom() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ── Monte Carlo (Geometric Brownian Motion) ───────────────────────
function runMonteCarlo(startValue) {
  const ctx = document.getElementById("monteChart");
  if (!ctx) return;

  const SIMULATIONS = 200;
  const DAYS = 30;
  const DRIFT = 0.0003;   // ~7.5% annual drift
  const VOL = 0.015;       // ~1.5% daily volatility (realistic equity)

  const allPaths = [];
  const avgPath = new Array(DAYS).fill(0);

  for (let s = 0; s < SIMULATIONS; s++) {
    const path = [];
    let v = startValue > 0 ? startValue : 10000;

    for (let d = 0; d < DAYS; d++) {
      // GBM: S(t+1) = S(t) × exp((μ - σ²/2)dt + σ√dt × Z)
      const z = gaussRandom();
      v *= Math.exp((DRIFT - 0.5 * VOL * VOL) + VOL * z);
      path.push(v);
      avgPath[d] += v;
    }
    allPaths.push(path);
  }

  for (let d = 0; d < DAYS; d++) avgPath[d] /= SIMULATIONS;

  // Sort by terminal value to get percentile paths
  allPaths.sort((a, b) => a[DAYS - 1] - b[DAYS - 1]);
  const bestPath  = allPaths[Math.floor(SIMULATIONS * 0.95)];
  const worstPath = allPaths[Math.floor(SIMULATIONS * 0.05)];

  if (monteChart) { monteChart.destroy(); }

  const labels = Array.from({ length: DAYS }, (_, i) => `D${i + 1}`);

  monteChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Best (95th %ile)",
          data: bestPath,
          borderColor: "#00d964",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
        {
          label: "Expected",
          data: avgPath,
          borderColor: "#3b82f6",
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
        {
          label: "Worst (5th %ile)",
          data: worstPath,
          borderColor: "#ef4444",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.3,
          fill: false,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          labels: { color: "#e2e8f0", font: { family: "'JetBrains Mono',monospace", size: 10 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => ` ${ctx.dataset.label}: £${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
      scales: {
        x: {
          title: { display: true, text: "Days", color: "#6b7280" },
          ticks: { color: "#6b7280", font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.03)" },
        },
        y: {
          title: { display: true, text: "Value (£)", color: "#6b7280" },
          ticks: {
            color: "#4a7090",
            font: { size: 10 },
            callback: (v) => "£" + v.toFixed(0),
          },
          grid: { color: "rgba(255,255,255,0.03)" },
        },
      },
    },
  });
}
