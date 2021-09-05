import { Router } from 'express';
import * as postResource from './post-resource';
import * as userResource from './user-resources';

const postRouter = Router();
postRouter.post('/', userResource.auth, postResource.add);
postRouter.get('/:id', userResource.auth, postResource.getById);
postRouter.get('/:id/commentsAndReactionsCount', userResource.auth, postResource.getCountOfCommentsAndReactions);
postRouter.delete('/:id', userResource.auth, postResource.remove);
postRouter.get('/owner/:owner', userResource.auth, postResource.getByUser);


export default postRouter;