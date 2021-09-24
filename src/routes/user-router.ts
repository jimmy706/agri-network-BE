import { Router } from 'express';
import * as userResource from './user-resources';

const userRouter = Router();
userRouter.post('/', userResource.add);
userRouter.get('/',userResource.auth,userResource.getUserLogin)
userRouter.patch('/',userResource.auth, userResource.update);
userRouter.get('/getDecodedToken', userResource.getDecodedToken);
userRouter.get('/:id', userResource.auth, userResource.getbyId);
userRouter.post('/:id/follow', userResource.auth, userResource.follow);
userRouter.post('/:id/unfollow', userResource.auth, userResource.unfollow);
userRouter.get('/:id/followers', userResource.auth, userResource.getFollowers);
userRouter.get('/:id/followings', userResource.auth, userResource.getFollowings);
userRouter.post('/getToken', userResource.getTokenFromUid);
userRouter.get('/search/userName',userResource.searchByUser);


export default userRouter;