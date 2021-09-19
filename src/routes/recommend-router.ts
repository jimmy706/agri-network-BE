import { Router } from 'express';
import * as recommendResource from './recommend-resource';
import * as userResource from './user-resources';
const recommendRouter = Router();

recommendRouter.get('/users', userResource.auth, recommendResource.getRecommendedUsers)

export default recommendRouter;