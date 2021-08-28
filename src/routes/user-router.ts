import * as userResource from './user-resources';
import { Router } from 'express';

const userRouter = Router();
userRouter.post('/', userResource.add);
userRouter.get('/getDecodedToken', userResource.getDecodedToken);
userRouter.get('/:id', userResource.getbyId);
userRouter.get('/:id/followers', userResource.getFollowers);


export default userRouter;