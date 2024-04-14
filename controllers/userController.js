import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.js";
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation - not empty
  //check if user already exists
  //check for images, check for avatar
  // upload image to cloudinary
  // create user object - create entry in db
  // remove password and refresh token from response
  // check for user creation
  // return response

  //1. get user details from frontend
  const { username, email, password, fullName } = req.body;

  //2. Validations
  if (
    [username, email, password, fullName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //3. Checking if User Already Exist
  const userExist = await User.findOne({
    $or: [{ email }, { username }],
  });
  console.log(userExist);
  if (userExist) {
    throw new ApiError(409, "User with this email or username already exist !");
  }

  //4. checking for images and avatar
  const localAvatarPath = req.files?.avatar[0]?.path;
  const localImagePath = req.files?.coverImage[0]?.path;
  if (!localAvatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //5.  upload image to cloudinary
  const avatar = await UploadOnCloudinary(localAvatarPath);
  const coverImage = await UploadOnCloudinary(localImagePath);

  //6.  create user object - create entry in db
  const userResponse = await User.create({
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    fullName,
    username: username.toLowerCase(),
  });

  //7.  check for user creation
  const userCreated = await User.findById(userResponse._id).select(
    "-password -refreshToken"
  );

  if (!userCreated) {
    throw new ApiError(500, "Something Went Wrong, try again");
  }

  //8. return response
  return res
    .status(201)
    .json(new ApiResponse(200, userCreated, "User Created Successfully"));
});

export { registerUser };
