import app from "./app.js";
import ConnectDB from "./db/db.js";
import dotenv from  "dotenv"
dotenv.config({
    path:'./.env'
})



ConnectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port ${process.env.PORT || 8000}`)
    })
})