import express, { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth.ts';


const moodController: Router = express.Router();


moodController.get("/mood/get", auth, async(req: Request, resp: Response) => {
    
})


export default moodController;