import { Router } from "express";
import { register, verifyEmail, login, getMe, logout, forgotPassword, resetPassword, testEmail } from "../controllers/auth.controller.js";
import { registerValidator, loginValidator } from "../validators/auth.validattor.js";
import {authUser} from "../middlewares/auth.middleware.js"

const authRouter = Router()

authRouter.post("/register", registerValidator, register)
authRouter.post("/login", loginValidator, login)
authRouter.get("/verify-email",verifyEmail)
authRouter.get("/get-me", authUser, getMe)
authRouter.get("/logout", authUser, logout)
authRouter.post("/logout", authUser, logout)
authRouter.post("/forgot-password", forgotPassword)
authRouter.post("/reset-password", resetPassword)
authRouter.get("/test-email", testEmail)

export default authRouter