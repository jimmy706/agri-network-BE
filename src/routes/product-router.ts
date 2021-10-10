import * as productResource from './product-resource';
import { auth } from './user-resources';
import { Router } from 'express';

const productRouter = Router();
productRouter.get('/', auth, productResource.search);

export default productRouter;