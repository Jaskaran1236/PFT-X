export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "Stock symbol required" });
  }

  const API_KEY = process.env.FINNHUB_API_KEY;

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`
    );

    const data = await response.json();

    return res.status(200).json({
      current: data.c,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch stock data" });
  }
}
