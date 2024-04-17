import { Router } from "express";
import { upload } from "../middlewares/multer.js";
import { veryfyJWT } from "../middlewares/auth.js";

const router = Router();

//Route Imports
import {
  registerUser,
  loginUser,
  logOutUser,
} from "../controllers/userController.js";

//Route defines
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//Secured routes
router.route("/logout").post(veryfyJWT, logOutUser);

export default router;
