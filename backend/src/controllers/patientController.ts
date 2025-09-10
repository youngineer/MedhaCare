import express, { Router, type Request, type Response } from 'express';
import { createResponse } from '../utils/helperFunctions.ts';
import { auth } from '../middleware/auth.ts';
import { patientServices } from '../services/patientServices.ts';

const patientController: Router = express.Router();


patientController.get("/patient/get", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const serviceResponse = await patientServices.getAllPatients();
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


patientController.get("/patient/get/:userId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const patientId = req?.params?.userId;
        if(!patientId || patientId != req?.user?._id) throw new Error("Invalid request");

        const serviceResponse = await patientServices.getPatient(patientId);
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


patientController.patch("/patient/update/:userId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const patientId = req?.user?._id;
        if(!patientId || (req?.user?.role === "therapist")) throw new Error("Invalid request");
        const payload = req?.body;
        if(!patientId) throw new Error("Invalid request");

        const serviceResponse = await patientServices.updatePatient(patientId, payload);
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


patientController.patch("/patient/delete/:userId", auth, async(req: Request, resp: Response): Promise<void> => {
    try {
        const patientId = req?.params?.userId;
        if(!patientId || !(req?.user?.role === "admin")) throw new Error("Invalid request");

        const serviceResponse = await patientServices.deletePatient(patientId);
        resp.status(200).json(createResponse(serviceResponse?.message, serviceResponse.content, req?.user?.role));
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, req?.user?.role));
    }
});


export default patientController;