import {Router} from 'express';
import * as InterestResource from './interest-resource';
import { auth } from './user-resources';

const interestRouter = Router();
interestRouter.post('/', auth, InterestResource.add);
interestRouter.get('/', auth, InterestResource.search);

export default interestRouter;