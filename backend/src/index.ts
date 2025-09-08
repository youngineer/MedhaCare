import * as dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import connectToDb from './config/database.ts';
import authController from './controllers/authController.ts';
dotenv.config();

// const PORT: string = process.env.PORT as string;
// const FRONTEND_URL: string = process.env.FRONTEND_URL as string;

const PORT: string = "3000";
const FRONTEND_URL: string = "http://localhost:5173";

const app = express();
app.use(
    cors({
        credentials: true, // for jwt token processing
        // origin: FRONTEND_URL //only process the requests from one frontend server
    })
);

app.use(express.json());
app.use(cookieParser());

app.use(authController);

connectToDb()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Successfully listening on port: ${PORT}`);
        });
    })
    .catch((e) => {
        console.error(`Error while connecting to db: ${e}`);
        process.exit(1);
    });
