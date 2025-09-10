
import Patient from "../models/Patient.ts";
import patient from "../models/Patient.ts";
import User, { type IUserDocument } from "../models/User.ts";
import type { IServiceResponse, IPatient, IPatientServices, IUser } from "../types/interfaces.ts";

export class PatientServices implements IPatientServices {
    async getAllPatients(): Promise<IServiceResponse> {
        try {

            const patients: IPatient[] = await Patient.find().lean().exec();

            if (!patients || patients.length === 0) {
                return {
                    status: false,
                    message: "No patients to show",
                    content: {}
                };
            }

            const userIds = patients.map(t => t.userId);
            const users = await User.find({ _id: { $in: userIds } }, '_id name photoUrl').lean().exec();
            const userMap = new Map<string, { _id: any; name?: string; photoUrl?: string }>();
            users.forEach(u => userMap.set(String(u._id), u as any));

            const userpatients = patients.map(t => {
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
                message: "patients fetched successfully!",
                content: userpatients,
                status: true
            };

        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch patients",
                content: {},
                status: false
            };
        }
    }

    async getPatient(id: string): Promise<IServiceResponse> {
        try {
            const patientUser: IUserDocument | null = await User.findOne({ _id: id, role: "patient" }, 'name photoUrl').exec();

            if (!patientUser) {
                return {
                    message: "patient not found",
                    content: {},
                    status: false
                };
            }

            const patient = await Patient.findOne({ userId: id });
            if (!patient) {
                return {
                    message: "patient not found",
                    content: {},
                    status: false
                };
            }

            const toReturn = {
                userId: id,
                name: patient?.name,
                photoUrl: patient?.photoUrl,
                healthConditions: patient?.healthConditions,
                dateOfBirth: patient?.dateOfBirth,
                gender: patient?.gender,
                contact: patient?.contact
            };

            return {
                message: "patient fetched successfully",
                content: toReturn,
                status: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch patient",
                content: {},
                status: false
            };
        }
    }

    async updatePatient(id: string, payload: Partial<IPatient>): Promise<IServiceResponse> {
        try {
            const dbpatient = await patient.findOne({ userId: id }).exec();
            if(!dbpatient) {
                return {
                    status: false,
                    message: "patient not found",
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

            const patientUpdate: Partial<IPatient> = {};
            if (payload.contact !== undefined) patientUpdate.contact = payload.contact;
            if (payload.gender !== undefined) patientUpdate.gender = payload.gender;
            if (payload.dateOfBirth !== undefined) patientUpdate.dateOfBirth = payload.dateOfBirth;
            if (payload.healthConditions !== undefined) patientUpdate.healthConditions = payload.healthConditions;

            if (Object.keys(patientUpdate).length > 0) {
                await Patient.findByIdAndUpdate(dbpatient._id, patientUpdate, {runValidators: true}).exec();
            }

            const updatedUser = await User.findById(id, 'name photoUrl').lean().exec();
            const updatedpatient = await Patient.findById(dbpatient._id).lean().exec();

            const toReturn = {
                userId: id,
                name: updatedUser?.name,
                photoUrl: updatedUser?.photoUrl,
                healthConditions: updatedpatient?.healthConditions,
                dateOfBirth: updatedpatient?.dateOfBirth,
                gender: updatedpatient?.gender,
                contact: updatedpatient?.contact
            };

            return {
                status: true,
                message: "patient updated successfully",
                content: toReturn
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to update patient",
                content: {},
                status: false
            };
        }
    }


    async deletePatient(userId: string): Promise<IServiceResponse> {
        try {
            const patient: IPatient | null = await Patient.findOneAndDelete({userId: userId});
            if(!patient) {
                return {
                    status: false,
                    message: "patient not found",
                    content: {}
                };
            }

            const user: IUser | null = await User.findByIdAndDelete(userId);
            if(!user) {
                return {
                    status: false,
                    message: "User patient not found",
                    content: {}
                };
            }

            return {
                status: true,
                message: "patient deleted successfully",
                content: {}
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to delete patient",
                content: {},
                status: false
            };
        }
    }
}

export const patientServices = new PatientServices();