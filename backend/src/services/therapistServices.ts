
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
            const therapistUser: IUser | null = await User.findOne({ _id: id, role: "therapist" }, 'name photoUrl').exec();

            if (!therapistUser) {
                return {
                    message: "Therapist not found",
                    content: {},
                    status: false
                };
            }

            const therapist = await Therapist.findOne({ userId: id });
            if (!therapist) {
                return {
                    message: "Therapist not found",
                    content: {},
                    status: false
                };
            }

            const toReturn = {
                userId: id,
                name: therapistUser?.name,
                photoUrl: therapistUser?.photoUrl,
                bio: therapist?.bio,
                specialties: therapist?.specialties,
                ratePerSession: therapist?.ratePerSession,
                availability: therapist?.availability,
                rating: therapist?.rating
            }

            return {
                message: "Therapist fetched successfully",
                content: toReturn,
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