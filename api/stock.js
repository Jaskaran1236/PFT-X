export default async function handler(req, res) {
  const { symbol } = req.query;
  const API_KEY = process.env.FINNHUB_API_KEY;

  if (!symbol) {
    return res.status(400).json({ error: "No symbol provided" });
  }

  try {

    // Get current price
    const quoteRes = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
    );
    const quoteData = await quoteRes.json();

    // Get 60 days of historical daily candles
    const now = Math.floor(Date.now() / 1000);
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60;

    const candleRes = await fetch(
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=D&from=${sixtyDaysAgo}&to=${now}&token=${API_KEY}`
    );

    const candleData = await candleRes.json();

    if (!candleData.c || candleData.c.length === 0) {
      return res.json({
        current: quoteData.c,
        previousClose: quoteData.pc,
        history: []
      });
    }

    return res.json({
      current: quoteData.c,
      previousClose: quoteData.pc,
      history: candleData.c
    });

  } catch (error) {
    return res.status(500).json({ error: "API fetch failed" });
  }
}
