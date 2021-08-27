import * as userResource from './user-resources';
import { Router } from 'express';

const userRouter = Router();
userRouter.post('/', userResource.add);
userRouter.post('/login', userResource.login);

export default userRouter;