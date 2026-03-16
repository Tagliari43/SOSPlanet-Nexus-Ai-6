import crypto from "crypto";

// Serverless Function para a Vercel
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "API Key and Secret are required" });
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const fullQuery = `${queryString}&signature=${signature}`;

    const response = await fetch(`https://api.binance.com/api/v3/account?${fullQuery}`, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Binance API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Binance Proxy Error:", error);
    res.status(500).json({ error: error.message });
  }
}
