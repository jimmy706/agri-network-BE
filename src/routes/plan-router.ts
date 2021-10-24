import { Router } from 'express';
import { auth } from './user-resources';
import * as planResource from './plan-resource';

const planRouter = Router();
planRouter.get('/', auth, planResource.search);
planRouter.post('/', auth, planResource.add);
planRouter.delete('/:id', auth, planResource.remove);

export default planRouter;