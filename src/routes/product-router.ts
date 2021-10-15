import * as productResource from './product-resource';
import { auth } from './user-resources';
import { Router } from 'express';

const productRouter = Router();
productRouter.get('/', auth, productResource.search);
productRouter.post('/', auth, productResource.add);
productRouter.get('/:id', auth, productResource.getById);
productRouter.put('/:id', auth, productResource.updateById);
productRouter.delete('/:id', auth, productResource.deleteById);

export default productRouter;