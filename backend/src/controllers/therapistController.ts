import express, { Router, type Request, type Response } from "express"
import { auth } from "../middleware/auth.ts";

const therapistController: Router = express.Router();


therapistController.get("/therapist/all", auth, async(req: Request, resp: Response) => {
    try {
        
    } catch (error) {
        
    }
})


export default therapistController;