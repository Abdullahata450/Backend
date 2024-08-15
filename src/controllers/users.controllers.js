import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const genrateAccessAndRefreshtoken =async(userId)=>{
    try {
         const user = await User.findById(userId)
         
        const AccessToke= user.generateAccessToken();  // access token will be given to user
        const RefreshToken = user.generateRefreshToken();  // whereas refresh token will be save to database to be used later without user login again and again
                                
        user.refreshToken=RefreshToken;  //saving refresh token into the database
        await user.save({validateBeforeSave:false});  // it will not kickin required fileds validation and it will save without validation

        return {AccessToke,RefreshToken}
    } catch (error) {
        throw new ApiError(500,error.message || "Something Went Wrong while Creating Refresh and Access Token");
    }
}

const RegisterUser = asyncHandler( async (req,res) =>{
    // get user Details From frontend. eg requst body
    // validate user details
    //check if user already exists
    //check for  images and avatar
    //upload them to cloudinary
    //creat user object due to mongodb 
    //remove password and refresh token from response
    // check for user creation then return

    const {username,email,password,fullname} = req.body;
    // console.log({fullname,username,email,password,});       // for testing Purpose to check data in console
    
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
     let coverImageLocalPath;
     if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
     }

    

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
    username: username.toLowerCase(),             // it will create a user with these objects data
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


      return res.json(
        new ApiResponse(200,createdUser, "User Registered Successfully")
      )
});

const loginUser= asyncHandler(async(req,res)=>{
    // get user details from frontend eg requst body
    // check if user exists with email or password
    // find the user
    // check if password is correct
    // generate access and Refresh token
    // send access and refresh token to cookies

    const {email,username,password} =req.body;
    
    if(!( email || username)){
        throw new ApiError(400,"Please Provide Username or password");
    }
     const user = await User.findOne(
        {                   //$ with dollar sign it is mongoDB operators
          $or :[{username},{email}]
        }
    )
    if(!user){
        throw new ApiError(404,"User Not Found with this Email or Username");
    }
                                            // we call this method by user not User because it is Database model where small user is not
    const ispasswordvalid=await user.isPasswordisCorrect(password);

    if(!ispasswordvalid){
        throw new ApiError(400,"Invalid Password");
    } 

    const {AccessToke,RefreshToken}=await genrateAccessAndRefreshtoken(user._id);  //here in return it will give access token and refresh token

     const loggedInUser= await User.findById(user._id).select("-password -refreshToken");

     const options ={       // to send somecookies we have some options these option will not modified by frontend
        httpOnly:true,           
        secure:true,
     }
     return res
    .status(200)
    .cookie("accessToken", AccessToke, options)
    .cookie("refreshToken", RefreshToken, options)
    .json(new ApiResponse(
        200,
        {
            user: loggedInUser, 
            AccessToke, 
            RefreshToken,
        },
        "User Logged In Successfully"
    ));

      


})

const logoutUser = asyncHandler(async(req,res)=>{
  await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
          new :true
        }
    )
    const options ={       //remove the cookies
        httpOnly:true,           
        secure:true,
     }
     return res.status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{} ,"User Logged Out Successfully"))

})

export {
    RegisterUser,
    loginUser,
    logoutUser
}