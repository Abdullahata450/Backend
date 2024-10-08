import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiErrors.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


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
    const options ={       //remove the cookiess
        httpOnly:true,           
        secure:true,
     }
     return res.status(200)
     .clearCookie("accessToken",options)
     .clearCookie("refreshToken",options)
     .json(new ApiResponse(200,{user:req.user.username} ,"User Logged Out Successfully"))  // it will display the name of user which logged out

})

const refreshAccessToken= asyncHandler(async(req,res)=>{

  const incomingRefreshToken =  req.cookie.refreshToken || req.body.refreshToken;

  if(!incomingRefreshToken){
    throw new ApiError(400,"Unauthorized Request");
  }

 try {
     const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
   
     if(!decodedToken){
         throw new ApiError(400,"Invalid Refresh Token");    
       }
   
      const user =  await User.findById(decodedToken?._id);
   
      if(!user){
       throw(new ApiError(404,"Invalid Refresh Token"));
      }
   
      if(incomingRefreshToken !== user?.refreshToken){
       throw new ApiError(400,"Refresh token is Expired");
      }
   
      const {accessToken,newRefreshToken} = await genrateAccessAndRefreshtoken(user._id);
   
      const option={
       httpOnly:true,
       secure:true
      }
      return res.status(200).
      cookie("refreshToken",newRefreshToken,option).
      cookie("accessToken",accessToken,option).
      json(new ApiResponse(200,
       {
       accessToken,
       refreshToken:newRefreshToken
      }
      ,"Access Token Refreshed Successfully"))
   
 } catch (error) {
     throw new ApiError(401,error.message || "Something Went Wrong while Refreshing Access Token");
 }
})

const changeUserPassword= asyncHandler(async(req,res) => 
{
    const {oldpassword,newpassword,confirmpassword}= req.body;

    if(!(newpassword == confirmpassword )){
        throw new ApiError(400,"Password does not match");
    }
    
     const user = await User.findById(req.user._id);
     const ispasswordvalid= await user.isPasswordisCorrect(oldpassword);
     if(!ispasswordvalid){
        throw new ApiError(400,"invalid old password");
     }
     user.password=newpassword
     await user.save({validateBeforeSave:false});
     return res.status(200).json(new ApiResponse(200,{},"Password Changed Successfully"))

})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res.status(200).json(new ApiResponse(200,req.user,"Current User fetched Successfully"))
})

const UpdateAccountDetails= asyncHandler(async(req,res)=>{

   const {fullname,email }= req.body
    
    if(!fullname || !email){
        throw ApiError(400,"Please Provide Fullname and Email");
    }
    
    const user= await User.findByIdAndUpdate(req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password");

    res.status(200).json(new ApiResponse(200,user,"Account Details Updated Successfully"))
})

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarlocalPath=req.files.path
    if(!avatarlocalPath){
        throw new ApiError(400,"Please Provide Avatar");
    }

    // removeoldavatarfromcloudinary= await cloudinary.uploader.destroy(req.user.avatar.public_id);
    const avatar = await uploadOnCloudinary(avatarlocalPath)

    if(!avatar.url){
        throw new ApiError(400,"Something Went Wrong while Uploading Avatar");
    }
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
               avatar: avatar.url
            }
        },
        {new :true}).select("-password")


        res.status(200).json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})

const updateUserCoverImage = asyncHandler(async(req,res) =>{
     
    const coverImageLocalPath = req.files.path;
    if(!coverImageLocalPath){
        throw new ApiError(400,"Please Provide Cover Image");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400,"Something Went Wrong while Uploading Cover Image");
    }
   const user =  await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new :true}).select("-password")

        res.status(200).json(new ApiResponse(200,user,"Cover Image Updated Successfully"))
})

const getUserChannleProfile=asyncHandler(async(req,res) =>{       // adding aggregation pipeline
   
   const {username} = req.params;

   if(!username){
    throw new ApiError(400,"Username is missing");
   }

   const channel = await User.aggregate([ 
    {  
        $match:{username: username.toLowerCase()}
    },
    {
        $lookup:{
            from : "subscriptions",
            localField : "_id",
            foreignField:"channel",
            as:"subscribers"
        }
    },
    {
        $lookup:{
            from : "subscriptions",
            localField : "_id",
            foreignField:"subscriber",
            as:"SubscribedTo"
        }
    },
    {
        $addFields:{
            subscriberCout:{
                $size:"$subscribers"
            },
            subscribedToCount:{
                $size:"$SubscribedTo"
            },
            isSubscribed:{
                $cond:{
                    if:{$in:[req.user._id,"$subscribers.subscriber"]},
                    then:true,
                    else:false
                }

            }

        }
    },
    {
         $project:{          //give Project to send particular data
          fullname:1,
          username:1,
          subscriberCout:1,
          subscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1,
         }
    }
])
if(!channel?.length){
    throw new ApiError(404,"Channel Not Found");    
}

return res.status(200).json(new ApiResponse(200,channel[0],"Channel Profile Fetched Successfully"))

})

const getUserHistory = asyncHandler(async(req,res) =>{
    const user = await User.aggregate([
        {                        // stage 1
          $match:{
            _id: new mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                  $project:{
                                    fullname:1,
                                    username:1,
                                    avatar:1,
                                  }
                                },
                                {
                                    $addFields:{
                                         owner:{
                                            $first:"$owner"
                                         }
                                    }
                                }
                            ]
                        }
                    },
                    // {
                    //     pipeline:[
                    //         {
                    //           $project:{
                    //             fullname:1,
                    //             username:1,
                    //             avatar:1,
                    //           }                             // you can also add pipeline here
                    //         },
                    //         {
                    //             $addFields:{
                    //                  owner:{
                    //                     $first:"$owner"
                    //                  }
                    //             }
                    //         }
                    //     ]
                    // }
                ]
            }
        }
    ])
    
    return res.status(200).json(new ApiResponse(200,user[0],"User History Fetched Successfully"))
})




export {
    RegisterUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    UpdateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannleProfile,
}