
import Therapist from "../models/Therapist.ts";
import User, { type IUserDocument } from "../models/User.ts";
import type { IServiceResponse, ITherapist, ITherapistServices, IUser } from "../types/interfaces.ts";

export class TherapistServices implements ITherapistServices {
    async getAllTherapists(): Promise<IServiceResponse> {
        try {
            const therapists: ITherapist[] = await Therapist.find().lean().exec();

            if (!therapists || therapists.length === 0) {
                return {
                    success: false,
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
                success: true
            };

        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch therapists",
                content: {},
                success: false
            };
        }
    }

    async getTherapist(id: string): Promise<IServiceResponse> {
        try {
            const therapistUser: IUserDocument | null = await User.findOne({ _id: id, role: "therapist" }, 'name photoUrl').exec();

            if (!therapistUser) {
                return {
                    message: "Therapist not found",
                    content: {},
                    success: false
                };
            }

            const therapist = await Therapist.findOne({ userId: id });
            if (!therapist) {
                return {
                    message: "Therapist not found",
                    content: {},
                    success: false
                };
            }

            const toReturn = {
                userId: id,
                name: therapistUser?.name,
                photoUrl: therapistUser?.photoUrl,
                bio: therapist?.bio,
                specialties: therapist?.specialties,
                ratePerSession: therapist?.ratePerSession,
                workingHours: therapist?.workingHours,
                daysOff: therapist?.daysOff,
                rating: therapist?.rating
            }

            return {
                message: "Therapist fetched successfully",
                content: toReturn,
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch therapist",
                content: {},
                success: false
            };
        }
    }

    async updateTherapist(id: string, payload: ITherapist): Promise<IServiceResponse> {
        try {
            const dbTherapist = await Therapist.findOne({ userId: id }).exec();
            if(!dbTherapist) {
                return {
                    success: false,
                    message: "Therapist not found",
                    content: {}
                };
            }

            const userUpdate: Partial<IUser> = {};
            if (payload.password) {
                const { hashPassword } = await import("./authServices.ts");
                userUpdate.password = hashPassword(payload.password as string) as any;
            }
            if (payload.photoUrl) {
                userUpdate.photoUrl = payload.photoUrl;
            }

            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(id, userUpdate, {runValidators: true}).exec();
            }

            const therapistUpdate: Partial<ITherapist> = {};
            if (payload.bio !== undefined) therapistUpdate.bio = payload.bio;
            if (payload.ratePerSession !== undefined) therapistUpdate.ratePerSession = payload.ratePerSession;
            if (payload.workingHours !== undefined) therapistUpdate.workingHours = payload.workingHours;
            if (payload.daysOff !== undefined) therapistUpdate.daysOff = payload.daysOff;
            if (payload.specialties !== undefined) therapistUpdate.specialties = payload.specialties;

            if (Object.keys(therapistUpdate).length > 0) {
                await Therapist.findByIdAndUpdate(dbTherapist._id, therapistUpdate, {runValidators: true}).exec();
            }

            const updatedUser = await User.findById(id, 'name photoUrl').lean().exec();
            const updatedTherapist = await Therapist.findById(dbTherapist._id).lean().exec();

            const toReturn = {
                userId: id,
                name: updatedUser?.name,
                photoUrl: updatedUser?.photoUrl,
                bio: updatedTherapist?.bio,
                specialties: updatedTherapist?.specialties,
                ratePerSession: updatedTherapist?.ratePerSession,
                workingHours: updatedTherapist?.workingHours,
                daysOff: updatedTherapist?.daysOff,
                rating: updatedTherapist?.rating
            };

            return {
                success: true,
                message: "Therapist updated successfully",
                content: toReturn
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to update therapist",
                content: {},
                success: false
            };
        }
    }


    async deleteTherapist(userId: string): Promise<IServiceResponse> {
        try {
            const therapist: ITherapist | null = await Therapist.findOneAndDelete({userId: userId});
            if(!therapist) {
                return {
                    success: false,
                    message: "Therapist not found",
                    content: {}
                };
            }

            const user: IUser | null = await User.findByIdAndDelete(userId);
            if(!user) {
                return {
                    success: false,
                    message: "User therapist not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "Therapist deleted successfully",
                content: {}
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to delete therapist",
                content: {},
                success: false
            };
        }
    }
}

export const therapistServices = new TherapistServices();