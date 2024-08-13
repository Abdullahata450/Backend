import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const RegisterUser = asyncHandler( async (req,res) =>{
    // get user Details From frontend.
    // validate user details
    //check if user already exists
    //check for  images and avatar
    //upload them to cloudinary
    //creat user object due to mongodb 
    //remove password and refresh token from response
    // check for user creation then return

    const {username,email,password,fullname} = req.body;
    console.log({fullname,username,email,password,});

    
    if ([username,email,fullname,password].some((field)=> field?.trim()==="")){     // check if these field are empty
        throw new ApiError(400,"Please Fill All Fields");
    }

   const existedUser=  await User.findOne({
        $or:[{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User With Email Or Username Already Exists");
    }

   const avatarlocalPath = req.files?.avatar[0]?.path;
   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatarlocalPath){
    throw new ApiError(400,"Please Upload Your Avatar then Try Again");           // avatar must be uploaded
   }
   const avatar = await uploadOnCloudinary(avatarlocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   if(!avatar){
    throw new ApiError(400,"Please Upload Your Avatar");           // avatar must be uploaded
   }


   const user = await User.create({
    fullname,
    avatar : avatar.url,
    coverImage : coverImage?.url || "",
    username: username.toLowerCase(),
    email,
    password,
   })

    // by default mognodb will create _id field
   const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"                 // by default selected all and this will not seleted theses fields
   );
    
   if(!createdUser){
    throw new ApiError(500,"Something Went Wrong while Registering a User");
   }


      return res.status(201).json(
        new ApiResponse(201,createdUser, "User Registered Successfully")
      )
})

export {RegisterUser}