import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = Router();

//Route Imports
import {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentpassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
} from "../controllers/userController.js";
import multer from "multer";

//Route defines
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//secured route
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refreshAccessToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changeCurrentpassword);
router.route("/getUser").get(verifyJWT, getCurrentUser);
router.route("/update-details").post(verifyJWT, updateAccountDetails);
router
  .route("/updateAvatar")
  .post(upload.single(), verifyJWT, updateUserAvatar);
router
  .route("/updateCoverImage")
  .post(upload.single(), verifyJWT, updateUserCoverImage);

export default router;
