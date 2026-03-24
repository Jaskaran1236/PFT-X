export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: "Ticker required" });
  }

  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1y`,
      { headers: { "User-Agent": "Mozilla/5.0 (compatible)" } }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: "Yahoo Finance error" });
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      return res.status(404).json({ error: "No history found for ticker" });
    }

    const timestamps = result.timestamp || [];
    const closes = result.indicators?.quote?.[0]?.close || [];

    const prices = timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString().split("T")[0],
        close: closes[i] ?? null,
      }))
      .filter((p) => p.close !== null && p.close > 0);

    res.status(200).json({ ticker, prices });
  } catch (error) {
    console.error("history API error:", error);
    res.status(500).json({ error: "History fetch failed" });
  }
}
