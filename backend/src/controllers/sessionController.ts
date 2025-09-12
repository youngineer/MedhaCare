import express, { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth.ts';
import { createResponse } from '../utils/helperFunctions.ts';
import { sessionServices } from '../services/sessionServices.ts';
import type { IServiceResponse } from '../types/interfaces.ts';


const sessionController: Router = express.Router();


sessionController.get("/session/get", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const userId = req?.user?._id;
        let serviceResponse: any = [];
        
        if(req?.user?.role === 'admin') serviceResponse = await sessionServices.getAllSessions();
        else serviceResponse = await sessionServices.getAllSessions(userId);
        
        if (serviceResponse.success) {
            resp.status(201).json(createResponse(serviceResponse.message, serviceResponse.content, req?.user?.role));
        } else {
            resp.status(400).json(createResponse(serviceResponse.message, {}, req?.user?.role));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


sessionController.post("/session/post", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        if(!(req?.user?.role === 'patient')) throw new Error("Invalid request");
        const userId = req?.user?._id;
        let serviceResponse: any = [];
        
        serviceResponse = await sessionServices.postSession(userId, req?.body);
        
        if (serviceResponse.success) {
            resp.status(201).json(createResponse(serviceResponse.message, serviceResponse.content, req?.user?.role));
        } else {
            resp.status(400).json(createResponse(serviceResponse.message, {}, req?.user?.role));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


sessionController.get("/session/get/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const sessionId = req?.params?.sessionId;
        if(!sessionId) throw new Error("Invalid request");

        const serviceResponse = await sessionServices.getSession(sessionId);
        if (serviceResponse.success) {
            resp.status(201).json(createResponse(serviceResponse.message, serviceResponse.content, req?.user?.role));
        } else {
            resp.status(400).json(createResponse(serviceResponse.message, {}, req?.user?.role));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});

sessionController.patch("/session/update/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const sessionId = req?.params?.sessionId;
        const payload = req?.body;
        if(!sessionId || !payload) throw new Error("Invalid request");

        const serviceResponse = await sessionServices.updateSession(sessionId, payload);
        if (serviceResponse.success) {
            resp.status(201).json(createResponse(serviceResponse.message, serviceResponse.content, req?.user?.role));
        } else {
            resp.status(400).json(createResponse(serviceResponse.message, {}, req?.user?.role));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});

sessionController.delete("/session/delete/:sessionId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const sessionId = req?.params?.sessionId;
        if(!sessionId) throw new Error("Invalid request");

        const serviceResponse = await sessionServices.deleteSession(sessionId);
        if (serviceResponse.success) {
            resp.status(201).json(createResponse(serviceResponse.message, serviceResponse.content, req?.user?.role));
        } else {
            resp.status(400).json(createResponse(serviceResponse.message, {}, req?.user?.role));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


export default sessionController;