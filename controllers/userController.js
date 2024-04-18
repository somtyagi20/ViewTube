import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.js";
import { UploadOnCloudinary } from "../utils/Cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import JWT from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;

    await user.save({
      validateBeforeSave: false,
    });

    return { accessToken, refreshToken };
  } catch (error) {
    console.log(error);
    throw new ApiError(
      500,
      "something went wrong while generating refresh and access token"
    );
  }
};

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
  // const localImagePath = req.files?.coverImage[0]?.path;
  let localImagePath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    localImagePath = req.files.coverImage[0].path;
  }
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

const loginUser = asyncHandler(async (req, res) => {
  //frontend-> username, email, password
  //check if username or email exist in db
  //match password
  //generate access and refresh token
  //send to the user

  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isMatch = await user.checkPassword(password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid Password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "User Logged in Successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken,
      })
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User Logged Out", {}));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //get refreshToken from frontend
  //verify refreshToken with JWT secret
  //make a db search and find user
  //compare refreshToken taken from frontend and db
  //generate new accessToken and set as cookie
  //send response to the user

  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "refresh Token unavailable");
  }

  const decodedToken = JWT.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  const user = await User.findById(decodedToken._id).select("-password");

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, "refresh token is expired or used");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, "access token refreshed successfully", {
        accessToken,
        refreshToken,
      })
    );
});

const changeCurrentpassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(401, "User not found");
  }
  const isPasswordCorrect = await user.checkPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old Password is incorrect");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully", {}));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(200, "User Generated Successfully", { user: req.user })
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  //Note: When updating files with text data,
  //make a separate endpoint and controller for updating files

  const { username, email, fullName } = req.body;
  if (!username || !email || !fullName) {
    throw new ApiError(401, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        username,
        email,
        fullName,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "User details updated successfully", { user }));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const localAvatarPath = req.file?.path;
  if (!localAvatarPath) {
    throw new ApiError(401, "Avatar file is missing");
  }

  const avatar = await UploadOnCloudinary(localAvatarPath);
  if (!avatar.url) {
    throw new ApiError(401, "Error, while uploading file on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { avatar: avatar.url },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "avatar updated successfully", { user }));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const localCoverImagePath = req.file?.path;
  if (!localCoverImagePath) {
    throw new ApiError(401, "Cover Image file is missing");
  }

  const coverImage = await UploadOnCloudinary(localCoverImagePath);
  if (!coverImage.url) {
    throw new ApiError(401, "Error, while uploading file on cloudinary");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: { coverImage: coverImage.url },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, "Cover Image updated successfully", { user }));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentpassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
