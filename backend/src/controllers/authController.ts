import type { Request, Response, Router } from "express";
import express from 'express';
import User from "../models/User.ts";
import { hashPassword, verifyPassword } from "../services/authServices.ts";
import { createResponse } from "../utils/helperFunctions.ts";
import Patient from "../models/Patient.ts";
import Therapist from "../models/Therapist.ts";


// /auth
const authController: Router = express.Router();


authController.post("/auth/signup", async(req: Request, resp: Response): Promise<void> => {
    try {
        const {name, emailId, password, role} = req?.body;

        const user = new User({
            name: name,
            emailId: emailId,
            password: hashPassword(password),
            role: role
        });
        const savedUser = await user.save();
        if(!savedUser) throw new Error("Could not save user. Try again");

        if(role === "patient") {
            const patient = new Patient({
                userId: savedUser.id
            });

            const savedPatient = await patient.save();
            if(!savedPatient) throw new Error("Could not save user. Try again");

        } else if(role === "therapist") {
            const therapist = new Therapist({
                userId: savedUser.id
            });

            const savedTherapist = therapist.save();
            if(!savedTherapist) throw new Error("Could not save Therapist. Try again");
        }

    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, null));
    }
})


authController.post("/auth/login", async(req: Request, resp: Response): Promise<void> => {
    try {
        const {emailId, password} = req?.body;
        const user = await User.findOne({ emailId }).exec();

        if (!user || !user.password || !verifyPassword(password, user.password)) {
            resp.status(401).json(createResponse("Invalid email or password", {}, null));
            return;
        }

        resp.status(302).redirect('/profile');
    } catch (error: any) {
        resp.status(500).json(createResponse(error.message, {}, null));
    }
})