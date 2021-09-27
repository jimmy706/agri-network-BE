import { Router } from 'express';
import * as postResource from './post-resource';
import * as userResource from './user-resources';

const postRouter = Router();
postRouter.post('/', userResource.auth, postResource.add);
postRouter.get('/', userResource.auth, postResource.get);
postRouter.get('/:id', userResource.auth, postResource.getById);
postRouter.put('/:id/like',userResource.auth, postResource.like);
postRouter.put('/:id/unlike', userResource.auth, postResource.unlike);
postRouter.post('/:id/addComment', userResource.auth, postResource.addComment);
postRouter.get('/:id/commentsAndReactionsCount', userResource.auth, postResource.getCountOfCommentsAndReactions);
postRouter.delete('/:id', userResource.auth, postResource.remove);
postRouter.get('/owner/:owner', userResource.auth, postResource.getByUser);



export default postRouter;