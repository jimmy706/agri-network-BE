import * as userResource from './user-resources';
import { Router } from 'express';

const userRouter = Router();
userRouter.post('/', userResource.add);
userRouter.get('/getDecodedToken', userResource.getDecodedToken);
userRouter.get('/:id', userResource.getbyId);
userRouter.post('/:id/follow', userResource.auth, userResource.follow);
userRouter.post('/:id/unfollow', userResource.auth, userResource.unfollow);
userRouter.get('/:id/followers', userResource.auth, userResource.getFollowers);
userRouter.post('/getToken', userResource.getTokenFromUid);


export default userRouter;