// api/prices.js — Vercel API Route
// Fetches real-time prices from Yahoo Finance

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { symbols } = req.query;
  if (!symbols) return res.status(400).json({ error: "symbols required" });

  const symList = symbols.split(",").map(s => s.trim().toUpperCase());

  try {
    const results = {};
    await Promise.all(symList.map(async (sym) => {
      try {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`;
        const r = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const data = await r.json();
        const quote = data?.chart?.result?.[0]?.meta;
        if (quote) {
          results[sym] = {
            price:  quote.regularMarketPrice || quote.previousClose,
            prev:   quote.previousClose,
            change: ((quote.regularMarketPrice - quote.previousClose) / quote.previousClose * 100).toFixed(2),
            name:   quote.shortName || sym,
            currency: quote.currency || "USD",
          };
        }
      } catch(e) {
        results[sym] = null;
      }
    }));
    res.status(200).json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
