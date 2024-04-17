import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import JWT from "jsonwebtoken";
import { User } from "../models/user.js";

export const veryfyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accesstoken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = JWT.verify(token, process.env.ACCESS_TOKEN_SECRET);

  const user = await User.findById(decodedToken?.id).select(
    "-password -refreshToken"
  );

  if (!user) {
    throw new ApiError(401, "Invalid Access token");
  }
  req.user = user;
  next();
});
