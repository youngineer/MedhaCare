import express, { Router, type Request, type Response } from 'express';
import { auth } from '../middleware/auth.ts';
import { chatServices } from '../services/chatServices.ts';
import { createResponse } from '../utils/helperFunctions.ts';
import type { ChatType } from '../types/interfaces.ts';

const chatController: Router = express.Router();

chatController.post("/chat/post", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const { message, chatType, receiverId } = req.body;
        const senderId = req.user?._id;

        if (!senderId || !message || !chatType) {
            resp.status(400).json(createResponse("Missing required fields", {}, req.user?.role));
            return;
        }

        const validChatTypes: ChatType[] = ["patient-therapist", "patient-bot", "therapist-bot"];
        if (!validChatTypes.includes(chatType)) {
            resp.status(400).json(createResponse("Invalid chat type", {}, req.user?.role));
            return;
        }

        const result = await chatServices.sendMessage(senderId, message, chatType, receiverId);

        if (result.success) {
            resp.status(201).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.get("/chat/patient-therapist/:therapistId", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const { therapistId } = req.params;
        const patientId = req.user?._id;

        if (!patientId || req.user?.role !== "patient") {
            resp.status(403).json(createResponse("Only patients can access this endpoint", {}, req.user?.role));
            return;
        }

        if (!therapistId) {
            resp.status(400).json(createResponse("Therapist ID is required", {}, req.user?.role));
            return;
        }

        const result = await chatServices.getPatientTherapistChats(patientId, therapistId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.get("/chat/therapist-patient/:patientId", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const { patientId } = req.params;
        const therapistId = req.user?._id;

        if (!therapistId || req.user?.role !== "therapist") {
            resp.status(403).json(createResponse("Only therapists can access this endpoint", {}, req.user?.role));
            return;
        }

        if (!patientId) {
            resp.status(400).json(createResponse("Patient ID is required", {}, req.user?.role));
            return;
        }

        const result = await chatServices.getPatientTherapistChats(patientId, therapistId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.get("/chat/patient-bot", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const patientId = req.user?._id;

        if (!patientId || req.user?.role !== "patient") {
            resp.status(403).json(createResponse("Only patients can access this endpoint", {}, req.user?.role));
            return;
        }

        const result = await chatServices.getPatientBotChats(patientId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.get("/chat/therapist-bot", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const therapistId = req.user?._id;

        if (!therapistId || req.user?.role !== "therapist") {
            resp.status(403).json(createResponse("Only therapists can access this endpoint", {}, req.user?.role));
            return;
        }

        const result = await chatServices.getTherapistBotChats(therapistId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.patch("/chat/mark-read", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const { chatType, partnerId } = req.body;
        const userId = req.user?._id;

        if (!userId || !chatType) {
            resp.status(400).json(createResponse("Missing required fields", {}, req.user?.role));
            return;
        }

        const result = await chatServices.markMessagesAsRead(userId, chatType, partnerId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});


chatController.get("/chat/unread-count", auth, async (req: Request, resp: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            resp.status(401).json(createResponse("User not authenticated", {}, null));
            return;
        }

        const result = await chatServices.getUnreadCount(userId);

        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.content, req.user?.role));
        } else {
            resp.status(400).json(createResponse(result.message, {}, req.user?.role));
        }

    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error.message, {}, req.user?.role));
    }
});

export default chatController;