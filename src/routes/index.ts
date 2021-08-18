import { Router } from 'express';
import { ping } from './Ping';
import userRouter from './User.router';




const pingRouter = Router();
pingRouter.get('/', ping);


// // Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use('/ping', pingRouter);
export default baseRouter;
