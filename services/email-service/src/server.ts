import { createApp } from "./app.js"

const port = Number(process.env.PORT || 4001)
const app = createApp()

app.listen(port, () => {
  console.log(`email-service listening on http://localhost:${port}`)
  console.log(`OpenAPI docs: http://localhost:${port}/docs`)
})
