export default async function handler(req, res) {
  const { ticker } = req.query;

  if (!ticker) {
    return res.status(400).json({ error: "Ticker required" });
  }

  try {
    // Fetch quote and GBP/USD rate in parallel
    const [quoteRes, fxRes] = await Promise.all([
      fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible)" } }
      ),
      fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=GBPUSD%3DX`,
        { headers: { "User-Agent": "Mozilla/5.0 (compatible)" } }
      ),
    ]);

    const [quoteData, fxData] = await Promise.all([
      quoteRes.json(),
      fxRes.json(),
    ]);

    const result = quoteData?.quoteResponse?.result;
    if (!result || result.length === 0) {
      return res.status(404).json({ error: "Ticker not found" });
    }

    const q = result[0];
    // GBPUSD=X price: how many USD per 1 GBP (e.g. 1.27)
    const gbpusdRate =
      fxData?.quoteResponse?.result?.[0]?.regularMarketPrice || 1.27;

    // Currency-aware GBP conversion
    // GBp = pence (London Stock Exchange) → divide by 100 first
    // GBP = already in pounds
    // USD / other = divide by gbpusdRate
    const currency = q.currency || "USD";

    function toGBP(usdAmount) {
      if (currency === "GBp") return usdAmount / 100;
      if (currency === "GBP") return usdAmount;
      return usdAmount / gbpusdRate;
    }

    const price = q.regularMarketPrice ?? null;
    const change = q.regularMarketChange ?? 0;
    const dayHigh = q.regularMarketDayHigh ?? null;
    const dayLow = q.regularMarketDayLow ?? null;
    const fiftyTwoHigh = q.fiftyTwoWeekHigh ?? null;
    const fiftyTwoLow = q.fiftyTwoWeekLow ?? null;

    res.status(200).json({
      ticker,
      price,
      priceGBP: price !== null ? parseFloat(toGBP(price).toFixed(4)) : null,
      change,
      changeGBP: parseFloat(toGBP(change).toFixed(4)),
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? null,
      marketCap: q.marketCap ?? null,
      dayHigh,
      dayHighGBP: dayHigh !== null ? parseFloat(toGBP(dayHigh).toFixed(4)) : null,
      dayLow,
      dayLowGBP: dayLow !== null ? parseFloat(toGBP(dayLow).toFixed(4)) : null,
      fiftyTwoWeekHigh: fiftyTwoHigh,
      fiftyTwoWeekHighGBP: fiftyTwoHigh !== null ? parseFloat(toGBP(fiftyTwoHigh).toFixed(4)) : null,
      fiftyTwoWeekLow: fiftyTwoLow,
      fiftyTwoWeekLowGBP: fiftyTwoLow !== null ? parseFloat(toGBP(fiftyTwoLow).toFixed(4)) : null,
      shortName: q.shortName || q.displayName || ticker,
      currency,
      gbpusdRate,
      exchangeName: q.fullExchangeName || null,
      marketState: q.marketState || "CLOSED",
    });
  } catch (error) {
    console.error("stock API error:", error);
    res.status(500).json({ error: "Price fetch failed" });
  }
}
