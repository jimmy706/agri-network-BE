import { Router } from 'express';
import * as mediaResource from './media-resource';
import * as userResource from './user-resources';

const mediaRouter = Router();
mediaRouter.post('/img/upload', userResource.auth, mediaResource.parseFormData, mediaResource.uploadImage);

export default mediaRouter;