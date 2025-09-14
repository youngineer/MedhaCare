import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";
import { createResponse } from "../utils/helperFunctions.ts";
import type { IUser } from "../types/interfaces.ts";

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    console.log("Fetching all therapist");
    try {
        const { token } = req.cookies;

        if (!token) {
            throw new Error("No token provided. Please login again.");
        }

        const jwtSecret: string = process.env.JWT_SECRET as string;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables.");
        }

        const decoded = jwt.verify(token, jwtSecret) as { _id: string };

        const user: IUser | null = await User.findById(decoded._id);
        if (!user) {
            throw new Error("User not found. Please login again.");
        }

        req.user = user;
        console.log("[auth] Auth successful for user:", user._id);
        next();
    } catch (error: any) {
        console.error("[auth] Error caught:", error.message, "\nStack:", error.stack);

        const response = createResponse(
            error.message || "Unexpected error during authentication",
            {},
            null
        );

        if (!res.headersSent) {
            res.status(401).json(response);
        } else {
            console.warn("[auth] Response already sent, skipping additional send.");
        }
    }
}
