// ── State ──────────────────────────────────────────────────────────
let portfolio = [];
let gbpUsdRate = 1.27; // fallback; refreshed on init

// ── API helpers ────────────────────────────────────────────────────
async function fetchStockData(ticker) {
  try {
    const res = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function refreshFxRate() {
  try {
    const res = await fetch("/api/stock?ticker=GBPUSD%3DX");
    const data = await res.json();
    if (data && data.price) {
      gbpUsdRate = data.price;
      const el = document.getElementById("fxRate");
      if (el) el.textContent = gbpUsdRate.toFixed(4);
    }
  } catch {
    // keep fallback
  }
}

// ── Add / Remove ───────────────────────────────────────────────────
window.addStock = async function () {
  const tickerEl = document.getElementById("ticker");
  const sharesEl = document.getElementById("shares");
  const buyPriceEl = document.getElementById("buyPrice");
  const errEl = document.getElementById("addError");

  const ticker = tickerEl.value.trim().toUpperCase();
  const shares = parseFloat(sharesEl.value);
  const buyPrice = parseFloat(buyPriceEl.value);

  errEl.textContent = "";

  if (!ticker) { errEl.textContent = "Ticker required"; return; }
  if (!shares || shares <= 0) { errEl.textContent = "Shares must be > 0"; return; }
  if (!buyPrice || buyPrice <= 0) { errEl.textContent = "Buy price must be > 0"; return; }

  if (portfolio.find((s) => s.ticker === ticker)) {
    errEl.textContent = `${ticker} already in portfolio`;
    return;
  }

  portfolio.push({
    ticker,
    shares,
    buyPrice,
    currentPrice: null,
    changePercent: null,
    dayHighGBP: null,
    dayLowGBP: null,
    shortName: null,
    marketState: null,
  });

  tickerEl.value = "";
  sharesEl.value = "";
  buyPriceEl.value = "";

  await updateDashboard();
};

window.removeStock = function (ticker) {
  portfolio = portfolio.filter((s) => s.ticker !== ticker);
  updateDashboard();
};

// ── Core refresh ───────────────────────────────────────────────────
async function updateDashboard() {
  let totalValue = 0;
  let totalCost = 0;

  for (const stock of portfolio) {
    const data = await fetchStockData(stock.ticker);

    if (data && data.priceGBP !== null) {
      stock.currentPrice = data.priceGBP;
      stock.changePercent = data.changePercent ?? 0;
      stock.dayHighGBP = data.dayHighGBP;
      stock.dayLowGBP = data.dayLowGBP;
      stock.shortName = data.shortName;
      stock.marketState = data.marketState;

      // Only include in totals if we have a live price
      totalValue += stock.shares * stock.currentPrice;
      totalCost += stock.shares * stock.buyPrice;
    }
  }

  const profit = totalValue - totalCost;
  const returnPct = totalCost > 0 ? (profit / totalCost) * 100 : 0;

  // Metric cards
  document.getElementById("portfolioValue").textContent = "£" + totalValue.toFixed(2);

  const profitEl = document.getElementById("portfolioProfit");
  profitEl.textContent = (profit >= 0 ? "+" : "") + "£" + profit.toFixed(2);
  profitEl.className = "mc-value " + (profit >= 0 ? "pos" : "neg");

  const returnEl = document.getElementById("portfolioReturn");
  returnEl.textContent = (returnPct >= 0 ? "+" : "") + returnPct.toFixed(2) + "%";
  returnEl.className = "mc-value " + (returnPct >= 0 ? "pos" : "neg");

  calculateAIScore();
  calculateRiskMetrics(totalValue, totalCost);
  renderPortfolioTable();
  updateMarketInsight();

  // Charts (defined in charts.js)
  drawAllocationChart(portfolio);
  runMonteCarlo(totalValue);

  // Market status from first stock with data
  const first = portfolio.find((s) => s.marketState);
  if (first) updateMarketStatus(first.marketState);

  // Efficient frontier (defined in Quant Engine.js)
  if (typeof QuantEngine !== "undefined" && portfolio.length >= 2) {
    QuantEngine.refresh(portfolio.map((s) => s.ticker));
  }

  document.getElementById("lastUpdated").textContent =
    "UPDATED: " + new Date().toLocaleTimeString("en-GB");
}

// ── Portfolio table ────────────────────────────────────────────────
function renderPortfolioTable() {
  const tableEl = document.getElementById("portfolioTable");
  const noPos = document.getElementById("noPositions");
  const tbody = document.getElementById("portfolioBody");

  if (portfolio.length === 0) {
    tableEl.style.display = "none";
    noPos.style.display = "block";
    return;
  }

  tableEl.style.display = "table";
  noPos.style.display = "none";
  tbody.innerHTML = "";

  for (const stock of portfolio) {
    const cp = stock.currentPrice;
    const value = cp ? stock.shares * cp : null;
    const cost = stock.shares * stock.buyPrice;
    const pnl = value !== null ? value - cost : null;
    const pnlPct = pnl !== null && cost > 0 ? (pnl / cost) * 100 : null;
    const dayChg = stock.changePercent;

    const pnlClass = pnl === null ? "neu" : pnl >= 0 ? "pos" : "neg";
    const dayClass = dayChg === null ? "neu" : dayChg >= 0 ? "pos" : "neg";
    const fmt = (v, prefix = "") =>
      v !== null ? `${v >= 0 ? prefix : ""}${v.toFixed(2)}` : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="amber" style="font-weight:700;">${stock.ticker}</td>
      <td>${stock.shares.toLocaleString()}</td>
      <td>${stock.buyPrice.toFixed(2)}</td>
      <td>${cp !== null ? cp.toFixed(2) : '<span class="spin"></span>'}</td>
      <td>${value !== null ? "£" + value.toFixed(2) : "—"}</td>
      <td class="${pnlClass}">${pnl !== null ? (pnl >= 0 ? "+" : "") + "£" + Math.abs(pnl).toFixed(2) : "—"}</td>
      <td class="${pnlClass}">${pnlPct !== null ? (pnlPct >= 0 ? "+" : "") + pnlPct.toFixed(1) + "%" : "—"}</td>
      <td class="${dayClass}">${dayChg !== null ? (dayChg >= 0 ? "+" : "") + dayChg.toFixed(2) + "%" : "—"}</td>
      <td><button class="tb-rm" onclick="removeStock('${stock.ticker}')">✕</button></td>
    `;
    tbody.appendChild(tr);
  }
}

// ── AI Score ──────────────────────────────────────────────────────
function calculateAIScore() {
  const el = document.getElementById("aiScore");

  const priced = portfolio.filter((s) => s.currentPrice !== null);
  if (priced.length === 0) { el.textContent = "—"; return; }

  let score = 50;

  for (const stock of priced) {
    const ret = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
    const day = stock.changePercent ?? 0;

    // Position return scoring
    if (ret > 30) score += 12;
    else if (ret > 15) score += 7;
    else if (ret > 0) score += 3;
    else if (ret < -30) score -= 12;
    else if (ret < -15) score -= 7;
    else score -= 3;

    // Momentum (day change)
    if (day > 3) score += 5;
    else if (day > 1) score += 2;
    else if (day < -3) score -= 5;
    else if (day < -1) score -= 2;
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  el.textContent = score;
  el.className = "mc-value " + (score >= 65 ? "pos" : score >= 40 ? "amber" : "neg");
}

// ── Risk metrics ──────────────────────────────────────────────────
function calculateRiskMetrics(totalValue, totalCost) {
  const varEl = document.getElementById("varValue");
  const sharpeEl = document.getElementById("sharpeRatio");

  if (totalValue <= 0) {
    varEl.textContent = "—";
    sharpeEl.textContent = "—";
    return;
  }

  // Parametric VaR: 95% confidence, ~1.645 z-score, 2% daily volatility baseline
  const dailyStd = 0.02;
  const var95 = totalValue * 1.645 * dailyStd;
  varEl.textContent = "-£" + var95.toFixed(2);
  varEl.className = "mc-value neg";

  // Annualised Sharpe: (total return - risk-free rate) / annual std dev
  // Risk-free = 4.5% p.a.; annual std = dailyStd × √252
  const totalReturn = totalCost > 0 ? (totalValue - totalCost) / totalCost : 0;
  const riskFreeRate = 0.045;
  const annualStd = dailyStd * Math.sqrt(252);
  const sharpe = (totalReturn - riskFreeRate) / annualStd;
  sharpeEl.textContent = sharpe.toFixed(2);
  sharpeEl.className = "mc-value " + (sharpe >= 1 ? "pos" : sharpe >= 0 ? "amber" : "neg");
}

// ── Market Insight ────────────────────────────────────────────────
function updateMarketInsight() {
  const el = document.getElementById("marketInsight");
  const priced = portfolio.filter((s) => s.currentPrice !== null);

  if (priced.length === 0) {
    el.textContent = "Add a stock to see insights.";
    return;
  }

  const lines = priced.map((stock) => {
    const ret = ((stock.currentPrice - stock.buyPrice) / stock.buyPrice) * 100;
    const day = stock.changePercent ?? 0;
    const trend = day > 1.5 ? "▲ BULLISH" : day < -1.5 ? "▼ BEARISH" : "► NEUTRAL";
    const trendClass = day > 0 ? "pos" : day < 0 ? "neg" : "neu";
    return `<span class="amber">${stock.ticker}</span> · <span class="${trendClass}">${trend}</span> · Day <span class="${day >= 0 ? "pos" : "neg"}">${day >= 0 ? "+" : ""}${day.toFixed(2)}%</span> · Return <span class="${ret >= 0 ? "pos" : "neg"}">${ret >= 0 ? "+" : ""}${ret.toFixed(2)}%</span>`;
  });

  el.innerHTML = lines.join("<br>");
}

// ── Market status badge ───────────────────────────────────────────
function updateMarketStatus(state) {
  const el = document.getElementById("marketStatus");
  if (!el) return;
  const map = {
    REGULAR: ['#00d964', 'pos', 'MARKET OPEN'],
    PRE:     ['#f59e0b', 'amber', 'PRE-MARKET'],
    POST:    ['#f59e0b', 'amber', 'AFTER HOURS'],
    CLOSED:  ['#6b7280', 'neu', 'MARKET CLOSED'],
  };
  const [color, cls, label] = map[state] || map.CLOSED;
  el.innerHTML = `<div class="sdot" style="background:${color};"></div><span class="${cls}">${label}</span>`;
}

// ── Live clock ────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById("liveClock");
  const tick = () => { el.textContent = new Date().toLocaleTimeString("en-GB"); };
  tick();
  setInterval(tick, 1000);
}

// ── Bootstrap ─────────────────────────────────────────────────────
(async function init() {
  startClock();
  await refreshFxRate();

  // These are defined in dashboard.js and Quant Engine.js
  if (typeof updateTickerBar === "function") updateTickerBar();
  if (typeof loadNews === "function") loadNews();
  if (typeof createHeatmap === "function") createHeatmap();
  if (typeof loadHedgeFunds === "function") loadHedgeFunds();

  // Auto-refresh every 30 s — setInterval is called ONCE here, never inside updateDashboard
  setInterval(async () => {
    if (portfolio.length > 0) await updateDashboard();
    if (typeof updateTickerBar === "function") updateTickerBar();
  }, 30000);

  setInterval(() => {
    if (typeof createHeatmap === "function") createHeatmap();
  }, 30000);

  setInterval(refreshFxRate, 60000);

  setInterval(() => {
    if (typeof loadNews === "function") loadNews();
  }, 300000);
})();
