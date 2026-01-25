import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

const uploadOnCloudinary = async (file) => {
    cloudinary.config({
        cloud_name: process.env.CLOUDNIARY_CLOUD_NAME,
        api_key: process.env.CLOUDNIARY_API_KEY,
        api_secret: process.env.CLOUDNIARY_API_SECRET
    });
    try {
        const result = await cloudinary.uploader.upload(file)
        fs.unlinkSync(file)
        return result.secure_url
    } catch (error) {
        fs.unlinkSync(file)
        console.log(error)
    }
}

export default uploadOnCloudinary