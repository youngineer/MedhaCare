import type { Request, Response, Router } from "express";
import express from 'express';
import User from "../models/User.ts";
import { hashPassword } from "../services/authServices.ts";
import { createResponse } from "../utils/helperFunctions.ts";
import Patient from "../models/Patient.ts";
import Therapist from "../models/Therapist.ts";

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