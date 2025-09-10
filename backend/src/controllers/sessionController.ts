import express, { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth.ts';
import { createResponse } from '../utils/helperFunctions.ts';


const sessionController: Router = express.Router();


sessionController.get("/session/all", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});

sessionController.get("/session/get/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});

sessionController.get("/session/update/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});

sessionController.get("/session/delete/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});