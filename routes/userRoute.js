import { Router } from "express";

const router = Router();

router.route("/register").post((req, res) => {
  res.send("Register");
});

export default router;
