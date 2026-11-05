// api/order.js
export default async function handler(req, res) {
  const TEABLE_TOKEN = process.env.TEABLE_TOKEN;
  const TABLE_ID = "tblblqXoomn1rCrIid6";
  const base = `https://app.teable.cn/api/table/${TABLE_ID}/record`;

  try {
    const url = req.method === "GET" ? `${base}?fieldKeyType=name&take=100` : base;
    const upstream = await fetch(url, {
      method: req.method,
      headers: {
        "Authorization": "Bearer " + TEABLE_TOKEN,
        "Content-Type": "application/json"
      },
      body: req.method === "GET" ? undefined : JSON.stringify(req.body)
    });
    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
