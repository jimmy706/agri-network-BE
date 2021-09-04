import { Router } from 'express';
import mediaRouter from './media-router';
import { ping } from './Ping';
import postRouter from './post-router';
import provinceRouter from './province-router';
import userRouter from './user-router';




const pingRouter = Router();
pingRouter.get('/', ping);


// // Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use('/ping', pingRouter);
baseRouter.use('/provinces', provinceRouter);
baseRouter.use('/medias', mediaRouter);
baseRouter.use('/posts', postRouter);
export default baseRouter;
