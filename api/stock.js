export default async function handler(req, res) {
  const { symbol } = req.query;

  const response = await fetch(
    `https://your-api-provider.com?symbol=${symbol}&apikey=${process.env.API_KEY}`
  );

  const data = await response.json();

  res.status(200).json({
    current: data.price,
    previousClose: data.previousClose
  });
}
