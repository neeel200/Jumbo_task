import { Router } from 'express';

const globalRouter = Router();
import authRouter from './routes/userRoute.js';
import gameRouter from './routes/gameRoute.js';

// globalRouter

globalRouter.use("/auth", authRouter);
globalRouter.use("/game", gameRouter);


export default globalRouter;
