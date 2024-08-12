import express from "express"
import cors from "cors"
import cookieParser from "cookies-parser"
const app= express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));
app.use(express.json({limit:"20kb"}))
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))




export default app;