import * as productResource from './product-resource';
import { auth } from './user-resources';
import { Router } from 'express';

const productRouter = Router();
productRouter.get('/', auth, productResource.search);
productRouter.post('/', auth, productResource.add);
productRouter.post('/sample', productResource.addSample);
productRouter.get('/sample', productResource.getSamples);
productRouter.get('/:id', auth, productResource.getById);
productRouter.put('/:id', auth, productResource.updateById);
productRouter.delete('/:id', auth, productResource.deleteById);
productRouter.post('/fromPlan/:planId', auth, productResource.addFromPlan);

export default productRouter;