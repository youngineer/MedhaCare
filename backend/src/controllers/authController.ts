import type { Request, Response, Router } from "express";
import express from 'express';
import { authService } from "../services/authServices.js";
import { createResponse } from "../utils/helperFunctions.js";
import type { ILoginRequest, ISignUpRequest } from "../utils/interfaces.js";

// path-> /auth
const authController: Router = express.Router();

authController.post("/auth/signup", async (req: Request, resp: Response): Promise<void> => {
    try {
        const signupData: ISignUpRequest = req.body;
        const result = await authService.signup(signupData);
        
        if (result.success) {
            resp.status(201).json(createResponse(result.message, {}, null));
        } else {
            resp.status(400).json(createResponse(result.message, {}, null));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error, {}, null));
    }
});

authController.post("/auth/login", async (req: Request, resp: Response): Promise<void> => {
    try {
        const loginData: ILoginRequest = req.body;
        const result = await authService.login(loginData);
        
        if (result.success) {
            resp.status(200).json(createResponse(result.message, result.user || {}, result.user?.role || null));
        } else {
            resp.status(401).json(createResponse(result.message, {}, null));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error, {}, null));
    }
});

export default authController;