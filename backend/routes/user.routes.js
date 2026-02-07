// routes/auth.routes.js
import express from "express";
import { getCurrentUser, updateUserLocation } from "../controllers/user.controllers.js";
import isAuth from "../middleware/isAuth.js";

const userRouter = express.Router();

userRouter.get("/current", isAuth, getCurrentUser);

// 👇 YAHAN CHANGE KARO: 'get' hata kar 'post' likho
userRouter.post("/update-location", isAuth, updateUserLocation); 

export default userRouter;