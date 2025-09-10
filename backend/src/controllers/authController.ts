import type { Request, Response, Router } from "express";
import express from 'express';
import { authService } from "../services/authServices.ts";
import { createResponse } from "../utils/helperFunctions.ts";
import type { ILoginRequest, ISignUpRequest } from "../types/interfaces.ts";

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
            const token = result?.token;
            resp.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000
            });

            resp.status(200).json(createResponse(result.message, {}, result.role || null));
        } else {
            resp.status(401).json(createResponse(result.message, {}, null));
        }
    } catch (error: any) {
        resp.status(500).json(createResponse("Internal server error: " + error, {}, null));
    }
});


authController.post("/auth/logout", async(req: Request, resp: Response) => {
    resp.cookie("token", null, {
        expires: new Date(Date.now())
    });

    resp.status(200).json(createResponse("Logout successful!", {}, null));
})

export default authController;