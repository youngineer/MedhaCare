import express, { Router, type Request, type Response } from "express"
import { auth } from "../middleware/auth.ts";
import { therapistServices } from "../services/therapistServices.ts";
import { createResponse } from "../utils/helperFunctions.ts";

const therapistController: Router = express.Router();


therapistController.get("/therapist/all", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const serviceResponse = await therapistServices.getAllTherapists();
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


therapistController.get("/therapist/profile", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const { therapistId } = req?.body;
        if(!therapistId) throw new Error("Invalid request");

        const serviceResponse = await therapistServices.getTherapist(therapistId);
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


export default therapistController;