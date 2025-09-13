import type { NextFunction, Request, Response } from "express";
import { createResponse } from "../utils/helperFunctions.ts";
import type { IUser } from "../types/interfaces.ts";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";

export async function auth(req: Request, resp: Response, next: NextFunction): Promise<void> {
    try {
        const { token } = req?.cookies;
        if(!token) {
            resp.cookie("token", null, {
                expires: new Date(Date.now())
            });

            resp.status(302).json(createResponse("Invalid or expired token. Please login again", {}, null)).redirect("/auth/login");
        }

        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded !== 'object') {
            resp.status(302).json(createResponse("Invalid or expired token. Please login again", {}, null)).redirect("/auth/login");
            return;
        }

        const expiry = (decoded as jwt.JwtPayload).exp;
        if (typeof expiry !== 'number') {
            resp.status(302).json(createResponse("Invalid or expired token. Please login again", {}, null)).redirect("/auth/login");
            return;
        }

        const now = new Date();
        if(now.getTime() > expiry * 1000) {
            resp.status(302).json(createResponse("Invalid or expired token. Please login again", {}, null)).redirect("/auth/login");
            return;
        }

        const jwtSecret: string = process.env.JWT_SECRET as string;
        if (!jwtSecret) {
            throw new Error("JWT_SECRET is not defined in environment variables.");
        }

        const decodedIdFromToken: { _id: string } = jwt.verify(token, jwtSecret) as { _id: string };
        const userId: string = decodedIdFromToken._id;

        const user: IUser | null = await User.findById(userId);
        if(!user) {
            resp.status(302).json(createResponse("Invalid or expired token. Please login again", {}, null)).redirect("/auth/login");
            return;
        }

        req.user = user;
        next();

    } catch (error: any) {
        const response = createResponse(
        error.message || "Unexpected error during authentication", {}, null);
        resp.status(400).json(response);
    }
}