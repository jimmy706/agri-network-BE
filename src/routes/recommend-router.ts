import { Router } from 'express';
import * as recommendResource from './recommend-resource';
import * as userResource from './user-resources';
const recommendRouter = Router();

recommendRouter.get('/users', userResource.auth, recommendResource.getRecommendedUsers);
recommendRouter.get('/products/nearby', userResource.auth, recommendResource.getRecommendedNearbyProducts);

export default recommendRouter;