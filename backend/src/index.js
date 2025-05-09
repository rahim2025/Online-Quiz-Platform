import express from 'express';
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import cors from "cors"

import authRouter from "./routers/auth.router.js"
import classRouter from "./routers/class.router.js"
import quizRouter from "./routers/quiz.router.js"
import notificationRouter from "./routers/notification.router.js"
import {connectDB} from "./lib/db.js"

dotenv.config();
const app = express();
app.use(cookieParser())

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
}))

app.use("/api/auth", authRouter)
app.use("/api/classes", classRouter)
app.use("/api/quizzes", quizRouter)
app.use("/api/notifications", notificationRouter)

app.listen(5000,()=>{
    console.log("Server is running on port 5000");
    connectDB();
});