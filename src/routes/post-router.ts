import { Router } from 'express';
import * as postResource from './post-resource';
import * as userResource from './user-resources';

const postRouter = Router();
postRouter.post('/', userResource.auth, postResource.add);

export default postRouter;