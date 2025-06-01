const express = require("express")
const routes = require("./routes/routes")

const app = express()
const port = 5000

const cors = require("cors")

app.use(cors())

app.use("/api", routes)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
})