import { createLogger, transports } from "winston"
import LokiTransport from "winston-loki"
import express from "express";
import client from "prom-client";
import "dotenv/config"
import responseTime from "response-time";

const logger = createLogger({
  transports: [
    new LokiTransport({
      labels: {
        appName: "express app",
      },
      host: "http://127.0.0.1:3100",
    }),
  ],
});
const app = express();

const PORT = process.env.PORT || 4444


const CollectDefaultMetric = client.collectDefaultMetrics;

CollectDefaultMetric({ register: client.register })
//app.use(express.json())

const reqresTime = new client.Histogram({
  name: 'http_express_req_time',
  help: 'this tells how much time the routes take',
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 400, 500, 800, 1000, 2000]
})

const totalReqCounter = new client.Counter({
  name: 'total_Requests',
  help: 'tells total Requests made lol'
})

app.use(responseTime((req, res, time) => {
  totalReqCounter.inc()
  reqresTime.labels({
    method: req.method,
    route: req.url,
    status_code: res.statusCode
  })
    .observe(time)
}))



app.get("/", (req, res) => {
  logger.info('Res came on /')
  res.json({
    message: "Hello World"
  })
})

app.get("/null", (req, res) => {
  logger.error(`oopsss`)
  return res.status(403)
})


app.get("/metrics", async (req, res) => {
  res.setHeader('Content-Type', client.register.contentType)
  const metrics = await client.register.metrics();
  res.send(metrics)
})

app.get("/slow", async (req, res) => {
  try {
    logger.info('req came from /slow')
    await new Promise((resolve) => setTimeout(resolve, 2000))
    res.json({
      message: "Done after 2 seconds"
    })
  }
  catch (error) {
    logger.error(`something went wrong here: ${error.message}`)
    return res.status(500).json({ status: "Error", error: "Internal Sever Error" });
  }
})

app.listen(PORT, () => {
  console.log(`server is running on : ${PORT}`)
})
