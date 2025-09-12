
import Patient from "../models/Patient.ts";
import patient from "../models/Patient.ts";
import Session from "../models/Session.ts";
import User, { type IUserDocument } from "../models/User.ts";
import type { IServiceResponse, IPatient, IPatientServices, IUser } from "../types/interfaces.ts";

export class PatientServices implements IPatientServices {
    async getAllPatients(therapistId?: string): Promise<IServiceResponse> {
        try {
            let patients = [];

            if (!therapistId) {
                const allPatients = await Patient.find().lean().exec();

                patients = await Promise.all(
                    allPatients.map(async (patient) => {
                        const user = await User.findById(patient.userId, 'name photoUrl');
                        if (!user) return null;

                        return {
                            name: user.name,
                            photoUrl: user.photoUrl,
                            gender: patient.gender,
                            dateOfBirth: this.calculateAge(patient.dateOfBirth),
                            healthConditions: patient.healthConditions,
                            contact: patient.contact,
                        };
                    })
                );

            } else {
                const sessionDocs = await Session.find({ therapistId }, 'patientId').lean().exec();
                const sessionPatientsIdList = sessionDocs.map(doc => doc.patientId.toString());

                patients = await Promise.all(
                    sessionPatientsIdList.map(async (id) => {
                        try {
                            const user = await User.findById(id, 'name photoUrl').lean().exec();
                            if (!user) return null;

                            const patient = await Patient.findOne({ userId: id }, '-_id -userId').lean().exec();
                            if (!patient) return null;

                            return {
                                name: user.name,
                                photoUrl: user.photoUrl,
                                gender: patient.gender,
                                dateOfBirth: this.calculateAge(patient.dateOfBirth),
                                healthConditions: patient.healthConditions,
                                contact: patient.contact,
                            };
                        } catch (err) {
                            console.error(`Error processing patient ID ${id}:`, err);
                            return null;
                        }
                    })
                );
            }

            patients = patients.filter(Boolean);

            if (patients.length === 0) {
                return {
                    success: false,
                    message: "No patients to show",
                    content: {},
                };
            }

            return {
                success: true,
                message: "Patients fetched successfully!",
                content: patients,
            };
        } catch (error: any) {
            return {
                success: false,
                message: error?.message || "Failed to fetch patients",
                content: {},
            };
        }
    }


    async getPatient(id: string): Promise<IServiceResponse> {
        try {
            const patientUser: Partial<IUserDocument> | null = await User.findOne({ _id: id}, 'name photoUrl').exec();
            console.log(patientUser)

            if (!patientUser) {
                return {
                    message: "patient not found",
                    content: {},
                    success: false
                };
            }

            const patient = await Patient.findOne({ userId: id });
            if (!patient) {
                return {
                    message: "patient not found",
                    content: {},
                    success: false
                };
            }

            const toReturn = {
                userId: id,
                name: patientUser?.name,
                photoUrl: patientUser?.photoUrl,
                healthConditions: patient?.healthConditions,
                dateOfBirth: patient?.dateOfBirth,
                gender: patient?.gender,
                contact: patient?.contact
            };

            return {
                message: "patient fetched successfully",
                content: toReturn,
                success: true
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to fetch patient",
                content: {},
                success: false
            };
        }
    }

    async updatePatient(id: string, payload: Partial<IPatient>): Promise<IServiceResponse> {
        try {
            const dbpatient = await patient.findOne({ userId: id }).exec();
            if(!dbpatient) {
                return {
                    success: false,
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
                success: true,
                message: "patient updated successfully",
                content: toReturn
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to update patient",
                content: {},
                success: false
            };
        }
    }


    async deletePatient(userId: string): Promise<IServiceResponse> {
        try {
            const patient: IPatient | null = await Patient.findOneAndDelete({userId: userId});
            if(!patient) {
                return {
                    success: false,
                    message: "patient not found",
                    content: {}
                };
            }

            const user: IUser | null = await User.findByIdAndDelete(userId);
            if(!user) {
                return {
                    success: false,
                    message: "User patient not found",
                    content: {}
                };
            }

            return {
                success: true,
                message: "patient deleted successfully",
                content: {}
            };
        } catch (error: any) {
            return {
                message: error?.message || "Failed to delete patient",
                content: {},
                success: false
            };
        }
    }

    private calculateAge(birthDate: Date) {
        const today = new Date();
        const birthYear = birthDate.getFullYear();
        const birthMonth = birthDate.getMonth();
        const birthDay = birthDate.getDate();

        let age = today.getFullYear() - birthYear;

        if (today.getMonth() < birthMonth || (today.getMonth() === birthMonth && today.getDate() < birthDay)) {
            age--;
        }

        return age;
    }
}

export const patientServices = new PatientServices();