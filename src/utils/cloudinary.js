
import { v2 } from "cloudinary";
import fs from "fs"

  cloudinary.config({ 
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_CLOUD_APIKEY,
    api_secret:  process.env.CLOUDINARY_CLOUD_SECRET
});

const uploadOnCloudinary = async (localFilepath) =>{
    try {
        if (!localFilepath) {
            return "Could not upload";
        }else{
          const response = await   v2.uploader.upload(localFilepath,{
                resource_type: "auto",
            })
            console.log("File Uploaded Successfully on Cloudinary",response.url);
            return response;
        }
    } catch (error) {
        fs.unlinkSync(localFilepath) // remove the file locally saved temporarily as the upload failed
        return null;
    }
}

export {uploadOnCloudinary};