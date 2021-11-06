import { Router } from 'express';
import { auth } from './user-resources';
import * as planResource from './plan-resource';

const planRouter = Router();
planRouter.get('/', auth, planResource.search);
planRouter.post('/', auth, planResource.add);
planRouter.get('/sample', planResource.getPlanSamples);
planRouter.post('/sample', planResource.addNewPlanSample);
planRouter.get('/sample/:id', auth, planResource.getSamplePlan);
planRouter.post('/sample/:id/create-plan', auth, planResource.addPlanFromSample);
planRouter.delete('/:id', auth, planResource.remove);
planRouter.get('/:id', auth, planResource.getById);

export default planRouter;