import mongoose, { Schema } from "mongoose";


const subscriptionSchema= new mongoose.Schema(
    {
         subscriber:{
            tyoe: Schema.Types.ObjectId,          // one wo is subscribing
            ref:'User',
         },
         channel:{
            tyoe: Schema.Types.ObjectId,
            ref:'User',                     // one to whome subscriber is subscribing
         }
    }
    
    ,{timestamps : true}

);

export const SubScription = mongoose.model("Subscription",subscriptionSchema);
