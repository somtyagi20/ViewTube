import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const UploadOnCloudinary = async (file) => {
  try {
    if (!file) return null;
    const response = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
    });
    console.log("file uploaded successfully on cloudinary !!", response.url);
    return response;
  } catch (error) {
    fs.unlinkSync(file);
    return null;
  }
};

export { UploadOnCloudinary };
