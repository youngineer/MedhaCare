
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

    async updateTherapist(id: string, payload: ITherapist): Promise<IServiceResponse> {
        try {
            // therapist records are stored with userId pointing to the User
            const dbTherapist = await Therapist.findOne({ userId: id }).exec();
            if(!dbTherapist) {
                return {
                    status: false,
                    message: "Therapist not found",
                    content: {}
                };
            }

            // Update user fields (password & photoUrl)
            const userUpdate: Partial<IUser> = {};
            if (payload.password) {
                // lazy import of authService hash function to avoid circular deps
                const { hashPassword } = await import("./authServices.ts");
                userUpdate.password = hashPassword(payload.password as string) as any;
            }
            if (payload.photoUrl) {
                userUpdate.photoUrl = payload.photoUrl;
            }

            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(id, userUpdate as any).exec();
            }

            // Update therapist profile fields
            const therapistUpdate: Partial<ITherapist> = {};
            if (payload.bio !== undefined) therapistUpdate.bio = payload.bio;
            if (payload.ratePerSession !== undefined) therapistUpdate.ratePerSession = payload.ratePerSession;
            if (payload.availability !== undefined) therapistUpdate.availability = payload.availability;
            if (payload.specialties !== undefined) therapistUpdate.specialties = payload.specialties;

            if (Object.keys(therapistUpdate).length > 0) {
                await Therapist.findByIdAndUpdate(dbTherapist._id, therapistUpdate as any).exec();
            }

            // Fetch fresh combined record
            const updatedUser = await User.findById(id, 'name photoUrl').lean().exec();
            const updatedTherapist = await Therapist.findById(dbTherapist._id).lean().exec();

            const toReturn = {
                userId: id,
                name: updatedUser?.name,
                photoUrl: updatedUser?.photoUrl,
                bio: updatedTherapist?.bio,
                specialties: updatedTherapist?.specialties,
                ratePerSession: updatedTherapist?.ratePerSession,
                availability: updatedTherapist?.availability,
                rating: updatedTherapist?.rating
            };

            return {
                status: true,
                message: "Therapist updated successfully",
                content: toReturn
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to update therapist",
                content: {},
                status: false
            };
        }
    }
}

export const therapistServices = new TherapistServices();