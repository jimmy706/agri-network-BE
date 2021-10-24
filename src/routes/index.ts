import { Router } from 'express';
import mediaRouter from './media-router';
import { ping } from './Ping';
import postRouter from './post-router';
import provinceRouter from './province-router';
import recommendRouter from './recommend-router';
import userRouter from './user-router';
import tagRouter from './tag-router';
import categoryRouter from './category-router';
import productRouter from './product-router';
import interestRouter from './interest-router';
import planRouter from './plan-router';

const pingRouter = Router();
pingRouter.get('/', ping);


// // Export the base-router
const baseRouter = Router();
baseRouter.use('/users', userRouter);
baseRouter.use('/ping', pingRouter);
baseRouter.use('/provinces', provinceRouter);
baseRouter.use('/medias', mediaRouter);
baseRouter.use('/posts', postRouter);
baseRouter.use('/recommend', recommendRouter);
baseRouter.use('/tag', tagRouter);
baseRouter.use('/category', categoryRouter);
baseRouter.use('/products', productRouter);
baseRouter.use('/interests', interestRouter);
baseRouter.use('/plans', planRouter);
export default baseRouter;
