export default async function handler(req, res) {
  const API_KEY = process.env.FINNHUB_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: "FINNHUB_API_KEY not configured" });
  }

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${API_KEY}`
    );

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Finnhub API error" });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ error: "Invalid news response" });
    }

    const news = data.slice(0, 10).map((item) => ({
      headline: item.headline || "",
      summary: item.summary || "",
      source: item.source || "",
      url: item.url || "",
      datetime: item.datetime || null,
      category: item.category || "",
      image: item.image || "",
    }));

    return res.status(200).json(news);
  } catch (error) {
    console.error("news API error:", error);
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
