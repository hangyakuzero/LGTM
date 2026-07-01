import express from "express";
import client from "prom-client";
import "dotenv/config"

const app = express();

const PORT = process.env.PORT || 4444


const CollectDefaultMetric = client.collectDefaultMetrics;

CollectDefaultMetric({ register: client.register })
app.use(express.json())

app.get("/", (req, res) => {
  res.json({
    message: "Hello World"
  })
})

app.get("/metrics", async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType)
  const metrics = await client.register.metrics();
  res.send(metrics)
})

app.listen(PORT, () => {
  console.log(`server is running on : ${PORT}`)
})
