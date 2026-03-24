// ── Quant Engine ─────────────────────────────────────────────────
// Markowitz Efficient Frontier via Monte Carlo weight sampling.
// Requires 2+ assets with historical price data from /api/history.
// ─────────────────────────────────────────────────────────────────
const QuantEngine = (function () {
  const historyCache = {};
  let frontierChart = null;

  // ── Fetch 1-year daily closing prices ──────────────────────────
  async function fetchHistory(ticker) {
    if (historyCache[ticker]) return historyCache[ticker];

    try {
      const res = await fetch(`/api/history?ticker=${encodeURIComponent(ticker)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.prices || data.prices.length < 10) return null;

      const closes = data.prices.map((p) => p.close).filter((c) => c > 0);
      historyCache[ticker] = closes;
      return closes;
    } catch {
      return null;
    }
  }

  // ── Log returns ────────────────────────────────────────────────
  function logReturns(prices) {
    const r = [];
    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > 0 && prices[i - 1] > 0) {
        r.push(Math.log(prices[i] / prices[i - 1]));
      }
    }
    return r;
  }

  // ── Sample covariance ──────────────────────────────────────────
  function cov(a, b) {
    const n = Math.min(a.length, b.length);
    if (n < 2) return 0;
    const ma = a.slice(0, n).reduce((s, x) => s + x, 0) / n;
    const mb = b.slice(0, n).reduce((s, x) => s + x, 0) / n;
    let c = 0;
    for (let i = 0; i < n; i++) c += (a[i] - ma) * (b[i] - mb);
    return c / (n - 1);
  }

  // ── Covariance matrix ──────────────────────────────────────────
  function covMatrix(matrix) {
    return matrix.map((ri) => matrix.map((rj) => cov(ri, rj)));
  }

  // ── Portfolio variance ─────────────────────────────────────────
  function portVariance(w, cm) {
    let v = 0;
    for (let i = 0; i < w.length; i++)
      for (let j = 0; j < w.length; j++)
        v += w[i] * w[j] * cm[i][j];
    return Math.max(0, v);
  }

  // ── Random normalised weights ──────────────────────────────────
  function randWeights(n) {
    const w = Array.from({ length: n }, () => Math.random());
    const s = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / s);
  }

  // ── Build frontier cloud ───────────────────────────────────────
  function buildFrontier(expReturns, cm) {
    const points = [];
    for (let i = 0; i < 2000; i++) {
      const w = randWeights(expReturns.length);
      const ret = w.reduce((acc, wi, idx) => acc + wi * expReturns[idx], 0);
      const risk = Math.sqrt(portVariance(w, cm));
      // Annualise: ×252 trading days
      points.push({ x: +(risk * Math.sqrt(252) * 100).toFixed(4), y: +(ret * 252 * 100).toFixed(4) });
    }
    return points;
  }

  // ── Render scatter chart ───────────────────────────────────────
  function renderFrontier(data) {
    const canvas = document.getElementById("frontierChart");
    const msg = document.getElementById("frontierMsg");
    if (!canvas) return;

    msg.style.display = "none";
    canvas.style.display = "block";

    if (frontierChart) { frontierChart.destroy(); }

    frontierChart = new Chart(canvas, {
      type: "scatter",
      data: {
        datasets: [{
          label: "Portfolio (annualised)",
          data,
          backgroundColor: "rgba(59,130,246,0.3)",
          pointRadius: 2,
          pointHoverRadius: 4,
        }],
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#e2e8f0", font: { family: "'JetBrains Mono',monospace", size: 10 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                ` Risk: ${ctx.parsed.x.toFixed(1)}%  Return: ${ctx.parsed.y.toFixed(1)}%`,
            },
          },
        },
        scales: {
          x: {
            title: { display: true, text: "Annual Risk (%)", color: "#6b7280" },
            ticks: { color: "#6b7280", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,0.03)" },
          },
          y: {
            title: { display: true, text: "Annual Return (%)", color: "#6b7280" },
            ticks: { color: "#6b7280", font: { size: 10 } },
            grid: { color: "rgba(255,255,255,0.03)" },
          },
        },
      },
    });
  }

  // ── Public: refresh with ticker list ──────────────────────────
  async function refresh(tickers) {
    const msg = document.getElementById("frontierMsg");
    const canvas = document.getElementById("frontierChart");

    if (!tickers || tickers.length < 2) {
      if (msg) msg.style.display = "block";
      if (canvas) canvas.style.display = "none";
      return;
    }

    const returnsMatrix = [];
    const expReturns = [];

    for (const ticker of tickers) {
      const prices = await fetchHistory(ticker);
      if (!prices || prices.length < 10) continue;

      const r = logReturns(prices);
      if (r.length === 0) continue;

      returnsMatrix.push(r);
      expReturns.push(r.reduce((a, b) => a + b, 0) / r.length);
    }

    if (returnsMatrix.length < 2) return;

    // Align all return series to the same (shortest) length
    const minLen = Math.min(...returnsMatrix.map((r) => r.length));
    const aligned = returnsMatrix.map((r) => r.slice(r.length - minLen));

    const cm = covMatrix(aligned);
    const frontierData = buildFrontier(expReturns, cm);

    renderFrontier(frontierData);
  }

  return { refresh };
})();
