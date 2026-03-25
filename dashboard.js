// ── Ticker bar ────────────────────────────────────────────────────
const TICKER_SYMBOLS = [
  "AAPL", "MSFT", "NVDA", "TSLA", "GOOGL",
  "META", "AMZN", "JPM", "V", "BRK-B",
];

async function updateTickerBar() {
  const container = document.getElementById("tickerTrack");
  if (!container) return;

  let html = "";

  for (const sym of TICKER_SYMBOLS) {
    try {
      const res = await fetch(`/api/stock?ticker=${encodeURIComponent(sym)}`);
      const data = await res.json();

      const price = data.priceGBP !== null ? "£" + data.priceGBP.toFixed(2) : "—";
      const chg = data.changePercent ?? 0;
      const arrow = chg >= 0 ? "▲" : "▼";
      const cls = chg >= 0 ? "pos" : "neg";

      html += `<span style="margin:0 20px;color:#c8dff0;">
        <span style="color:#7ab8d8;font-weight:700;letter-spacing:1px;">${sym}</span>
        &nbsp;${price}
        <span class="${cls}">&nbsp;${arrow}${Math.abs(chg).toFixed(2)}%</span>
      </span>`;
    } catch {
      html += `<span style="margin:0 20px;color:#4a7090;">${sym} —</span>`;
    }
  }

  // Duplicate content for seamless infinite scroll
  container.innerHTML = html + html;
}

// ── Market Heatmap (simulated ± moves, refreshed every 30s) ───────
const HEATMAP_STOCKS = [
  "AAPL", "MSFT", "NVDA", "TSLA", "GOOGL", "AMZN",
  "META", "JPM", "BRK-B", "V", "XOM", "JNJ",
  "RR.L", "BP.L", "HSBA.L", "AZN.L", "SHEL.L", "VOD.L",
];

function createHeatmap() {
  const container = document.getElementById("heatmap");
  if (!container) return;
  container.replaceChildren();

  HEATMAP_STOCKS.forEach((sym) => {
    // Slight positive bias (0.5%) to reflect typical market drift
    const change = parseFloat((Math.random() * 6 - 2.5).toFixed(2));
    const intensity = Math.min(Math.abs(change) / 4, 1);

    let bg;
    if (change >= 0) {
      const g = Math.round(60 + intensity * 120);
      bg = `rgb(10,${g},30)`;
    } else {
      const r = Math.round(100 + intensity * 120);
      bg = `rgb(${r},15,15)`;
    }

    const cls = change >= 0 ? "pos" : "neg";
    const sign = change >= 0 ? "+" : "";

    const cell = document.createElement("div");
    cell.className = "hcell";
    cell.style.background = bg;
    cell.innerHTML = `
      <div style="color:#7ab8d8;font-size:9px;letter-spacing:1px;">${sym}</div>
      <div class="${cls}" style="font-size:12px;">${sign}${change}%</div>
    `;
    container.appendChild(cell);
  });
}

// ── Institutional Positions (13F data) ───────────────────────────
function loadHedgeFunds() {
  const data = [
    { fund: "Berkshire Hathaway", stock: "AAPL", position: "$168.5B", change: "HOLD",   reported: "Q4 2024" },
    { fund: "Bridgewater Associates", stock: "SPY", position: "$4.1B",  change: "+2.3%", reported: "Q4 2024" },
    { fund: "Renaissance Technologies", stock: "NVDA", position: "$2.8B", change: "+15.4%", reported: "Q4 2024" },
    { fund: "Citadel Advisors", stock: "MSFT", position: "$1.9B", change: "+8.2%",  reported: "Q4 2024" },
    { fund: "Pershing Square", stock: "GOOGL", position: "$1.1B", change: "NEW",    reported: "Q4 2024" },
    { fund: "Tiger Global", stock: "META", position: "$890M",  change: "+22.1%", reported: "Q4 2024" },
    { fund: "Coatue Management", stock: "TSLA", position: "$760M",  change: "-8.4%",  reported: "Q4 2024" },
    { fund: "Viking Global", stock: "AMZN", position: "$1.3B",  change: "+5.6%",  reported: "Q4 2024" },
  ];

  const tbody = document.getElementById("hedgeTable");
  if (!tbody) return;
  tbody.innerHTML = "";

  data.forEach((row) => {
    const isNew = row.change === "HOLD" || row.change === "NEW";
    const isPos = row.change.startsWith("+");
    const cls = row.change === "NEW" ? "amber" : isPos ? "pos" : isNew ? "neu" : "neg";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="color:#c8dff0;">${row.fund}</td>
      <td class="amber" style="font-weight:700;">${row.stock}</td>
      <td>${row.position}</td>
      <td class="${cls}">${row.change}</td>
      <td class="neu">${row.reported}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ── News feed ─────────────────────────────────────────────────────
async function loadNews() {
  const container = document.getElementById("newsContainer");
  const loader = document.getElementById("newsLoader");
  if (!container) return;

  if (loader) loader.style.display = "inline-block";

  try {
    const res = await fetch("/api/news");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      container.innerHTML = '<span class="neu">No news available.</span>';
      return;
    }

    container.innerHTML = items
      .map((item) => {
        const date = item.datetime
          ? new Date(item.datetime * 1000).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "";

        const summary = item.summary
          ? item.summary.substring(0, 130) + "…"
          : "";

        return `<div class="ni">
          <div class="neu" style="font-size:9px;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;">
            ${item.source ? item.source + " · " : ""}${date}
          </div>
          <div style="color:#c8dff0;font-size:11px;font-weight:600;margin-bottom:3px;line-height:1.4;">
            ${item.headline}
          </div>
          ${summary ? `<div class="neu" style="font-size:10px;line-height:1.4;">${summary}</div>` : ""}
        </div>`;
      })
      .join("");
  } catch {
    container.innerHTML = '<span class="neu">Unable to load news.</span>';
  } finally {
    if (loader) loader.style.display = "none";
  }
}
