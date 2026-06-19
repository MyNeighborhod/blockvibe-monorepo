import dotenv from "dotenv"
import { createApp } from "./app.js"

// Load local environment variables if any
dotenv.config()

const app = createApp()
const port = process.env.PORT || 4002

app.listen(port, () => {
  console.log(`[Chat Service] Running locally on port ${port}`)
  console.log(`[Chat Service] Health check: http://localhost:${port}/health`)
})
