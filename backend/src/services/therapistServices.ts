
import Therapist from "../models/Therapist.ts";
import User from "../models/User.ts";
import type { IServiceResponse, ITherapist, ITherapistServices, IUser } from "../types/interfaces.ts";

export class TherapistServices implements ITherapistServices {
    async getAllTherapists(): Promise<IServiceResponse> {
        try {
            const therapists: ITherapist[] = await Therapist.find().lean().exec();

            if (!therapists || therapists.length === 0) {
                return {
                    status: false,
                    message: "No therapists to show",
                    content: {}
                };
            }

            const userIds = therapists.map(t => t.userId);
            const users = await User.find({ _id: { $in: userIds } }, '_id name photoUrl').lean().exec();
            const userMap = new Map<string, { _id: any; name?: string; photoUrl?: string }>();
            users.forEach(u => userMap.set(String(u._id), u as any));

            const userTherapists = therapists.map(t => {
                const u = userMap.get(String(t.userId));
                return {
                    userId: t.userId,
                    name: u?.name || null,
                    photoUrl: u?.photoUrl || null,
                    bio: (t as any).bio || null,
                    specialties: (t as any).specialties || [],
                    ratePerSession: (t as any).ratePerSession || 0,
                    rating: (t as any).rating || 0
                };
            });

            return {
                message: "Therapists fetched successfully!",
                content: userTherapists,
                status: true
            };

        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch therapists",
                content: {},
                status: false
            };
        }
    }

    async getTherapist(id: string): Promise<IServiceResponse> {
        try {
            const therapist: IUser | null = await User.findOne({ _id: id, role: "therapist" }, '_id name photoUrl').exec();

            if (!therapist) {
                return {
                    message: "Therapist not found",
                    content: {},
                    status: false
                };
            }

            return {
                message: "Therapist fetched successfully",
                content: therapist,
                status: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch therapist",
                content: {},
                status: false
            };
        }
    }
}

export const therapistServices = new TherapistServices();