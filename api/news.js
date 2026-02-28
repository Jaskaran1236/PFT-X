export default async function handler(req, res) {
  const API_KEY = process.env.FINNHUB_API_KEY;

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/news?category=general&token=${API_KEY}`
    );

    const data = await response.json();

    return res.status(200).json(data.slice(0, 5));
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}
