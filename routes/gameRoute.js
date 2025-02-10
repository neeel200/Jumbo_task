import { Router } from "express";
import verifyToken from "../middleware/auth.js";
import { StartTheGame } from "../controllers/gameController.js";

const gameRouter = Router();

gameRouter.post("/start", verifyToken, StartTheGame);

export default gameRouter;
