import * as provinceResource from './province-resource';
import { Router } from 'express';


const provinceRouter = Router();
provinceRouter.get("/", provinceResource.getAll);

export default provinceRouter;