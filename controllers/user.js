import { asyncHandler } from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res, next) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exists
  //check for images, check for avatar
  // upload image to cloudinary
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creation
  // return response
});

export { registerUser };
