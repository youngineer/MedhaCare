import Mood from "../models/Mood.ts";
import Session from "../models/Session.ts";
import type { IUserDocument } from "../models/User.ts";
import type { IMood, IMoodServices, IServiceResponse } from "../types/interfaces.ts";



export class MoodServices implements IMoodServices {
    async addMood(payload: IMood, user: IUserDocument): Promise<IServiceResponse> {
        try {
            if(user?.role !== 'patient') throw new Error("Invalid request");

            const mood = new Mood(payload);
            const savedMood = await mood.save();

            if(!savedMood) throw new Error("Unable to save. Try again");

            return {
                message: "Mood added successfully",
                content: {},
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to add moods",
                content: {},
                success: false
            };
        }

    }
    async getMoods(user: IUserDocument, patientId: string): Promise<IServiceResponse> {
        try {
            if(user?.role === 'therapist') {
                const sessionTherapistPatientList = await Session.find({therapistId: user?._id}, 'patientId').exec();
                const validReq: boolean = sessionTherapistPatientList.some(s => String((s as any).patientId) === patientId);

                if(!validReq) throw new Error("Invalid request");
            }

            const moodList: IMood[] = await Mood.find({patientId: patientId}, 'moodLevel tags createdAt').exec();

            return {
                message: "Moods fetched successfully",
                content: { moods: moodList },
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch moods",
                content: {},
                success: false
            };
        }
    }

    async getMood(moodId: string): Promise<IServiceResponse> {
        try {
            const mood: IMood | null = await Mood.findById(moodId, 'moodLevel tags created_at').exec();
            if(!mood) {
                return {
                    message: "Mood not found",
                    content: {},
                    success: false
                };
            }

            return {
                message: "Mood fetched successfully",
                content: { mood: mood },
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch mood",
                content: {},
                success: false
            };
        }
    }

    async deleteMood(moodId: string, user: IUserDocument): Promise<IServiceResponse> {
        try {
            const mood: IMood | null = await Mood.findByIdAndDelete(moodId).exec();
            if(!mood) {
                return {
                    message: "Mood not found",
                    content: {},
                    success: false
                };
            }

            return {
                message: "Mood deleted successfully",
                content: { mood: mood },
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch moods",
                content: {},
                success: false
            };
        }
    }
};

const moodServices = new MoodServices();
export default moodServices;