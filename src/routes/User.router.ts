import * as userResource from './UserResource';
import { Router } from 'express';

const userRouter = Router();
userRouter.post('/', userResource.add);
userRouter.post('/login', userResource.login);

export default userRouter;