import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(

{
    username:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true,
        index:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trime:true,
    },
    fullname:{
         type:String,
         required:true,
         trim:true,
    },
    avatar:{
        type:String,
        required:true,
    },
    coverImage:{
        type:String,
    },
    watchHistory:[
        {
            type:Schema.Types.ObjectId,
            ref:"Video",
        }
    ],
    password:{
        type:String,
        required:[true,"Please provide password"], 
    },
    refreshToken:{
        type:String,
    }


},
{
    timestamps:true,
}

);
userSchema.pre("save", async function (next) {
  
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next();
    
})
userSchema.methods.isPasswordisCorrect = async function(password) {
   return await bcrypt.compare(password,this.password);                       // if the user enter the password it will check the password form database which is in encrpeyted form and compare it with the user password
}

userSchema.methods.generateAccessToken = function() {
 return  jwt.sign({
        _id:this._id,                           // this is JWT payload 
        email:this.email,
        password:this.password,
        fullname:this.fullname,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)

}
userSchema.methods.generateRefreshToken = function() {
    return  jwt.sign({
           _id:this._id,                           // this is payload
       },
       process.env.REFRESH_TOKEN_SECRET,
       {
           expiresIn:process.env.REFRESH_TOKEN_EXPIRY
       }
   )
}

export const User = mongoose.model("User",userSchema);
