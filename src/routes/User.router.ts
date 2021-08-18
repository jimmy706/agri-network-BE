import * as userResource from './Users';
import { Router } from 'express';

const userRouter = Router();
userRouter.post('/', userResource.add);

export default userRouter;