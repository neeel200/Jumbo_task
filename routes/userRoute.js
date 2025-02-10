
import { Router } from "express";
import { RegisterUser, UserLogin } from "../controllers/userController.js";

const authRouter = Router();

authRouter.post("/register", RegisterUser);
authRouter.post("/login", UserLogin);

export default authRouter;
