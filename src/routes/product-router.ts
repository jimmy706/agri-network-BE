import { Router } from 'express';
import * as productResource from './product-resource'
import * as userResource from './user-resources';


const ProductRouter = Router();
ProductRouter.get("/category", userResource.auth, productResource.getProductType);


export default ProductRouter;