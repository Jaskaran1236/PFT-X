export default async function handler(req, res) {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: "No symbol provided" });
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
    );

    const data = await response.json();

    if (!data || !data.c) {
      return res.status(404).json({ error: "Stock not found" });
    }

    res.status(200).json({
      current: data.c,
      previousClose: data.pc
    });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
}
