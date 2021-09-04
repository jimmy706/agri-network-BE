import { Router } from 'express';
import * as mediaResource from './media-resource';

const mediaRouter = Router();
mediaRouter.post('/img/upload', mediaResource.parseFormData, mediaResource.uploadImage);

export default mediaRouter;