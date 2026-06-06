// api/history.js — Vercel API Route
// Fetches historical price data from Yahoo Finance

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const { symbol, period } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol required" });

  const rangeMap = {
    "1D": { range: "1d",  interval: "5m"  },
    "1W": { range: "5d",  interval: "1h"  },
    "1M": { range: "1mo", interval: "1d"  },
    "3M": { range: "3mo", interval: "1d"  },
    "1Y": { range: "1y",  interval: "1wk" },
    "3Y": { range: "3y",  interval: "1wk" },
    "5Y": { range: "5y",  interval: "1mo" },
    "10Y":{ range: "10y", interval: "1mo" },
  };

  const { range, interval } = rangeMap[period] || rangeMap["1Y"];

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${range}&interval=${interval}`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "No data" });

    const timestamps = result.timestamp || [];
    const closes     = result.indicators?.quote?.[0]?.close || [];

    const out = timestamps.map((ts, i) => ({
      date:  new Date(ts * 1000).toLocaleDateString("en", { month: "short", day: "numeric" }),
      value: closes[i] ? +closes[i].toFixed(2) : null,
    })).filter(d => d.value !== null);

    res.status(200).json({ symbol, period, data: out });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
