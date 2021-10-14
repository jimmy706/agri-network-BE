import { Router } from 'express';
import * as recommendResource from './recommend-resource';
import { auth } from './user-resources';
const recommendRouter = Router();

recommendRouter.get('/users', auth, recommendResource.getRecommendedUsers);
recommendRouter.get('/products/nearby', auth, recommendResource.getRecommendedProductsNearby);
recommendRouter.get('/products/friends', auth, recommendResource.getRecommendedProductsFromFriends);

export default recommendRouter;