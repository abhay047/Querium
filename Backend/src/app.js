import express from "express"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"
import chatRouter from "./routes/chat.routes.js"
import morgan from "morgan"
import cors from "cors"

const app = express()

// CORS must be the first middleware so error responses always contain Access-Control-Allow-Origin
app.use(cors({
    origin: function (origin, callback) {
        return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}))

// Support up to 10MB payload limit (enforces 5MB raw image upload limit)
app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ limit: "10mb", extended: true }))
app.use(cookieParser())
app.use(morgan("dev"))

app.use("/api/auth", authRouter)
app.use("/api/chats", chatRouter)

export default app