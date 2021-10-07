import { Router } from 'express';
import * as categoryResource from './category-resource';
import * as userResource from './user-resources';


const CategoryRouter = Router();
CategoryRouter.get("/", userResource.auth, categoryResource.getProductType);


export default CategoryRouter;