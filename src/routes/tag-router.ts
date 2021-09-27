import * as tagResource from './tag-resource'
import { Router } from 'express';

const tagRouter = Router();
tagRouter.get("/postTag", tagResource.getPostTag);

export default tagRouter;