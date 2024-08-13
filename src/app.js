import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app= express();
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));
app.use(express.json({limit:"20kb"}))
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))


//Routes import
import userRoutes from "./routes/user.routes.js"

// Routes Decleration
app.use("/api/v1/users",userRoutes)      //for Example if requst is  http:localhost:8000/api/v1/users/ it will go to userRoutes


export default app;