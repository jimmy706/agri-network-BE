import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';


import express, { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import 'express-async-errors';

import BaseRouter from './routes';
import logger from '@shared/Logger';

import mongoose from 'mongoose';
const cors = require('cors')

const app = express();
const { INTERNAL_SERVER_ERROR } = StatusCodes;



/************************************************************************************
 *                              Set basic express settings
 ***********************************************************************************/
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}

// Add APIs
app.use('/api', BaseRouter);

// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    logger.err(err, true);
    return res.status(err.status || INTERNAL_SERVER_ERROR).json(err);
});



/************************************************************************************
 *                              Mongodb setup
 ***********************************************************************************/
const { MONGO_USER, MONGO_PASSWORD, MONGO_HOST, MONGO_PORT, MONGO_DB_NAME } = process.env;

mongoose.connect(`mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => {
        logger.info(`Conneceted to mongodb to host: ${MONGO_HOST}:${MONGO_PORT}`)
    })
    .catch(error => {
        logger.err(error);
    })




export default app;
