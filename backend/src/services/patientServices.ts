import Chat from "../models/Chat.ts";
import Mood from "../models/Mood.ts";
import Patient from "../models/Patient.ts";
import Session from "../models/Session.ts";
import User, { type IUserDocument } from "../models/User.ts";
import type { 
    IServiceResponse, 
    IPatient, 
    IPatientServices, 
    IUser, 
    ISessionMetadata, 
    ITherapeuticContext, 
    ChatType, 
    IConversationMessage, 
    IUserProfile, 
    IAIResponse, 
    IAIContext 
} from "../types/interfaces.ts";
import { AI_CONTEXT_LIMITS, PATIENT_DAILY_SUMMARY_PROMPT } from "../utils/constants.ts";
import { getEnhancedAIResponse } from "./aiServices.ts";

export class PatientServices implements IPatientServices {
    
    async getAllPatients(therapistId?: string): Promise<IServiceResponse> {
        try {
            console.log(`🔍 Getting all patients${therapistId ? ` for therapist: ${therapistId}` : ''}`);
            
            // If therapistId provided, get patients for that specific therapist
            if (therapistId) {
                return await this.getPatientsByTherapist(therapistId);
            }
            
            // Otherwise, get all patients (admin functionality)
            const allPatients = await Patient.find().lean().exec();
            console.log(`📊 Found ${allPatients.length} patients in database`);

            const patients = await Promise.all(
                allPatients.map(async (patient) => {
                    try {
                        const user = await User.findById(patient.userId, 'name photoUrl emailId').lean();
                        if (!user) {
                            console.warn(`User not found for patient userId: ${patient.userId}`);
                            return null;
                        }

                        return {
                            userId: patient.userId,
                            name: user.name,
                            photoUrl: user.photoUrl,
                            emailId: user.emailId,
                            gender: patient.gender,
                            age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : null,
                            dateOfBirth: patient.dateOfBirth,
                            healthConditions: patient.healthConditions || [],
                            contact: patient.contact,
                            aiReport: patient.aiReport
                        };
                    } catch (err) {
                        console.error(`Error processing patient ${patient.userId}:`, err);
                        return null;
                    }
                })
            );

            const validPatients = patients.filter(Boolean);
            console.log(`Successfully processed ${validPatients.length} patients`);

            if (validPatients.length === 0) {
                return {
                    success: false,
                    message: "No patients found",
                    content: {},
                };
            }

            return {
                success: true,
                message: "Patients fetched successfully!",
                content: { patients: validPatients },
            };
        } catch (error: any) {
            console.error('❌ Error in getAllPatients:', error);
            return {
                success: false,
                message: error?.message || "Failed to fetch patients",
                content: {},
            };
        }
    }

    async getPatient(id: string): Promise<IServiceResponse> {
        try {
            
            const patientUser = await User.findById(id, 'name photoUrl emailId').lean();
            if (!patientUser) {
                console.error(`  User not found: ${id}`);
                return {
                    message: "Patient user not found",
                    content: {},
                    success: false
                };
            }

            const patient = await Patient.findOne({ userId: id }).lean();
            if (!patient) {
                console.error(`  Patient profile not found for userId: ${id}`);
                return {
                    message: "Patient profile not found",
                    content: {},
                    success: false
                };
            }

            const patientData = {
                userId: id,
                name: patientUser.name,
                photoUrl: patientUser.photoUrl,
                emailId: patientUser.emailId,
                healthConditions: patient.healthConditions || [],
                dateOfBirth: patient.dateOfBirth,
                age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : null,
                gender: patient.gender,
                contact: patient.contact,
                aiReport: patient.aiReport
            };

            return {
                message: "Patient fetched successfully",
                content: patientData,
                success: true
            };
        } catch (error: any) {
            console.error(`  Error in getPatient for ID ${id}:`, error);
            return {
                message: error?.message || "Failed to fetch patient",
                content: {},
                success: false
            };
        }
    }

    async updatePatient(id: string, payload: Partial<IPatient>): Promise<IServiceResponse> {
        try {
            
            const dbPatient = await Patient.findOne({ userId: id }).exec();
            if (!dbPatient) {
                console.error(`  Patient not found: ${id}`);
                return {
                    success: false,
                    message: "Patient not found",
                    content: {}
                };
            }

            // Update User fields if provided
            const userUpdate: Partial<IUser> = {};
            if (payload.name) userUpdate.name = payload.name;
            if (payload.emailId) userUpdate.emailId = payload.emailId;
            if (payload.photoUrl) userUpdate.photoUrl = payload.photoUrl;
            if (payload.password) {
                const { hashPassword } = await import("./authServices.ts");
                userUpdate.password = hashPassword(payload.password);
            }

            if (Object.keys(userUpdate).length > 0) {
                await User.findByIdAndUpdate(id, userUpdate, { runValidators: true }).exec();
            }

            const patientUpdate: Partial<IPatient> = {};
            if (payload.contact !== undefined) patientUpdate.contact = payload.contact;
            if (payload.gender !== undefined) patientUpdate.gender = payload.gender;
            if (payload.dateOfBirth !== undefined) patientUpdate.dateOfBirth = payload.dateOfBirth;
            if (payload.healthConditions !== undefined) patientUpdate.healthConditions = payload.healthConditions;
            if (payload.aiReport !== undefined) patientUpdate.aiReport = payload.aiReport;

            if (Object.keys(patientUpdate).length > 0) {
                await Patient.findByIdAndUpdate(dbPatient._id, patientUpdate, { runValidators: true }).exec();
            }

            const updatedUser = await User.findById(id, 'name photoUrl emailId').lean();
            const updatedPatient = await Patient.findById(dbPatient._id).lean();

            const updatedData = {
                userId: id,
                name: updatedUser?.name,
                photoUrl: updatedUser?.photoUrl,
                emailId: updatedUser?.emailId,
                healthConditions: updatedPatient?.healthConditions || [],
                dateOfBirth: updatedPatient?.dateOfBirth,
                age: updatedPatient?.dateOfBirth ? this.calculateAge(updatedPatient.dateOfBirth) : null,
                gender: updatedPatient?.gender,
                contact: updatedPatient?.contact,
                aiReport: updatedPatient?.aiReport
            };

            return {
                success: true,
                message: "Patient updated successfully",
                content: updatedData
            };
        } catch (error: any) {
            console.error(`Error in updatePatient for ID ${id}:`, error);
            return {
                message: error?.message || "Failed to update patient",
                content: {},
                success: false
            };
        }
    }

    async deletePatient(userId: string): Promise<IServiceResponse> {
        try {
            const deletedPatient = await Patient.findOneAndDelete({ userId });
            if (!deletedPatient) {
                console.error(`Patient profile not found: ${userId}`);
                return {
                    success: false,
                    message: "Patient profile not found",
                    content: {}
                };
            }

            const deletedUser = await User.findByIdAndDelete(userId);
            if (!deletedUser) {
                console.error(`  User account not found: ${userId}`);
                return {
                    success: false,
                    message: "User account not found",
                    content: {}
                };
            }

            await Promise.all([
                Chat.deleteMany({ 
                    $or: [
                        { senderId: userId },
                        { receiverId: userId }
                    ]
                }),
                Mood.deleteMany({ patientId: userId }),
                Session.deleteMany({ 
                    $or: [
                        { patientId: userId },
                        { therapistId: userId }
                    ]
                })
            ]);

            return {
                success: true,
                message: "Patient deleted successfully",
                content: {}
            };
        } catch (error: any) {
            console.error(`  Error in deletePatient for ID ${userId}:`, error);
            return {
                message: error?.message || "Failed to delete patient",
                content: {},
                success: false
            };
        }
    }

    async generateSummary(userId: string): Promise<IServiceResponse> {
        try {
            const aiContext = await this.buildAIContext(userId, "patient-bot");
            const enhancedResponse = await this.getEnhancedAIResponse(aiContext, PATIENT_DAILY_SUMMARY_PROMPT);
            
            if (!enhancedResponse) {
                console.error(`Failed to get AI response for summary: ${userId}`);
                return {
                    success: false,
                    message: "Failed to generate summary",
                    content: {}
                };
            }

            const aiReportData = {
                ...enhancedResponse,
                generatedAt: new Date().toISOString(),
                userId: userId,
                reportType: 'daily_summary',
                metadata: {
                    promptUsed: PATIENT_DAILY_SUMMARY_PROMPT,
                    contextIncluded: {
                        moodData: !!aiContext.therapeuticContext.recentMoodEntries?.length,
                        conversationHistory: !!aiContext.conversationHistory.length,
                        sessionData: !!aiContext.therapeuticContext.lastTherapySession,
                        riskLevel: aiContext.userProfile.currentRiskLevel || 'unknown'
                    }
                }
            };

            const savedSummary: IPatient | null = await Patient.findOneAndUpdate(
                { userId: userId }, 
                { aiReport: aiReportData },
                { new: true }
            );
            
            if (!savedSummary) {
                throw new Error("Couldn't generate report. Try again");
            }

            return {
                success: true,
                message: "Summary generated successfully",
                content: { 
                    reportData: aiReportData
                }
            };

        } catch (error: any) {
            console.error(`Error in generateSummary for ID ${userId}:`, error);
            return {
                message: error?.message || "Failed to generate summary",
                content: {},
                success: false
            };
        }
    }

    async buildAIContext(senderId: string, chatType: ChatType, receiverId?: string): Promise<IAIContext> {
        try {
            // Get user profile
            const userProfile = await this.buildUserProfile(senderId);
            
            // Get conversation history
            const conversationHistory = await this.getConversationHistory(senderId, chatType, receiverId);
            
            // Get therapeutic context
            const therapeuticContext = await this.getTherapeuticContext(senderId, receiverId);
            
            // Get session metadata
            const sessionMetadata = this.getSessionMetadata();
            
            return {
                userProfile,
                conversationHistory,
                therapeuticContext,
                sessionMetadata,
                systemPrompt: PATIENT_DAILY_SUMMARY_PROMPT
            };

        } catch (error: any) {
            console.error("  Error building AI context:", error);
            // Return minimal context on error
            return {
                userProfile: {
                    userId: senderId,
                    role: null,
                    name: "Unknown User"
                },
                conversationHistory: [],
                therapeuticContext: {},
                sessionMetadata: this.getSessionMetadata(),
                systemPrompt: PATIENT_DAILY_SUMMARY_PROMPT
            };
        }
    }

    async getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse> {
        try {
            
            const enhancedResponse = await getEnhancedAIResponse(context, userMessage);
            
            if (!enhancedResponse) {
                console.warn(' AI service returned null, using fallback response');
                // Fallback response if AI fails
                return {
                    response: "I'm here to help, but I'm having trouble processing your message right now. Please try again or contact your therapist if this is urgent.",
                    responseType: "supportive",
                    emotionalTone: "empathetic",
                    confidenceScore: 0.5,
                    escalationRequired: false
                };
            }

            return enhancedResponse;
        } catch (error: any) {
            console.error('  Error getting enhanced AI response:', error);
            return {
                response: "I apologize, but I'm experiencing technical difficulties. Please try again later or contact your therapist if you need immediate assistance.",
                responseType: "supportive",
                emotionalTone: "empathetic",
                confidenceScore: 0.3,
                escalationRequired: true
            };
        }
    }

    private async buildUserProfile(userId: string): Promise<IUserProfile> {
        try {
            const user = await User.findById(userId, 'name role').lean();
            if (!user) {
                console.warn(` User not found for profile building: ${userId}`);
                return {
                    userId,
                    role: null,
                    name: "Unknown User"
                };
            }

            // Get recent mood trend (last 7 days average)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentMoods = await Mood.find({
                patientId: userId,
                createdAt: { $gte: sevenDaysAgo }
            }, 'moodLevel createdAt').lean() as any[];

            const userProfile: IUserProfile = {
                userId,
                role: user.role,
                name: user.name
            };

            if (recentMoods.length > 0) {
                const recentMoodTrend = recentMoods.reduce((sum, mood) => sum + mood.moodLevel, 0) / recentMoods.length;
                userProfile.recentMoodTrend = Math.round(recentMoodTrend * 10) / 10;

                // Determine risk level based on mood trend
                if (recentMoodTrend <= 3) {
                    userProfile.currentRiskLevel = "high";
                } else if (recentMoodTrend <= 5) {
                    userProfile.currentRiskLevel = "medium";
                } else if (recentMoodTrend <= 7) {
                    userProfile.currentRiskLevel = "low";
                } else {
                    userProfile.currentRiskLevel = "low";
                }
            }

            return userProfile;
        } catch (error: any) {
            console.error('  Error building user profile:', error);
            return {
                userId,
                role: null,
                name: "Unknown User"
            };
        }
    }

    private async getConversationHistory(senderId: string, chatType: ChatType, receiverId?: string): Promise<IConversationMessage[]> {
        try {
            let query: any = {};

            if (chatType === "patient-therapist" && receiverId) {
                query = {
                    chatType: "patient-therapist",
                    $or: [
                        { senderId, receiverId },
                        { senderId: receiverId, receiverId: senderId }
                    ]
                };
            } else if (chatType === "patient-bot") {
                query = { chatType: "patient-bot", senderId };
            } else if (chatType === "therapist-bot") {
                query = { chatType: "therapist-bot", senderId };
            }

            const recentChats = await Chat.find(query)
                .sort({ timestamp: -1 })
                .limit(AI_CONTEXT_LIMITS?.RECENT_MESSAGES || 10)
                .lean();

            return recentChats.map(chat => ({
                senderId: chat.senderId,
                senderRole: chat.senderRole,
                message: chat.message,
                timestamp: chat.timestamp,
                isFromBot: !!chat.botResponse
            })).reverse();

        } catch (error: any) {
            console.error('  Error getting conversation history:', error);
            return [];
        }
    }

    private async getTherapeuticContext(senderId: string, receiverId?: string): Promise<ITherapeuticContext> {
        try {
            const context: ITherapeuticContext = {};

            // Get recent mood entries
            const moodDays = AI_CONTEXT_LIMITS?.MOOD_ENTRIES_DAYS || 7;
            const cutoffDate = new Date(Date.now() - moodDays * 24 * 60 * 60 * 1000);
            const recentMoodEntries = await Mood.find({
                patientId: senderId,
                createdAt: { $gte: cutoffDate }
            }, 'moodLevel tags createdAt').lean() as any[];

            context.recentMoodEntries = recentMoodEntries.map(mood => ({
                moodLevel: mood.moodLevel,
                tags: mood.tags || [],
                timestamp: mood.createdAt || new Date()
            }));

            // Get upcoming appointments
            const upcomingAppointments = await Session.find({
                $or: [
                    { patientId: senderId, dateTime: { $gte: new Date() } },
                    { therapistId: senderId, dateTime: { $gte: new Date() } }
                ]
            }, 'dateTime').lean();

            context.upcomingAppointments = upcomingAppointments.map(session => session.dateTime);

            // Get last therapy session
            const lastSession = await Session.findOne({
                $or: [
                    { patientId: senderId, dateTime: { $lt: new Date() } },
                    { therapistId: senderId, dateTime: { $lt: new Date() } }
                ]
            }, 'dateTime').sort({ dateTime: -1 }).lean();

            if (lastSession) {
                context.lastTherapySession = lastSession.dateTime;
            }

            // Determine treatment phase based on session history
            const sessionCount = await Session.countDocuments({
                $or: [
                    { patientId: senderId },
                    { therapistId: senderId }
                ]
            });

            if (sessionCount === 0) {
                context.treatmentPhase = "initial";
            } else if (sessionCount < 5) {
                context.treatmentPhase = "active";
            } else {
                context.treatmentPhase = "maintenance";
            }

            return context;
        } catch (error: any) {
            console.error('  Error getting therapeutic context:', error);
            return {};
        }
    }

    private getSessionMetadata(): ISessionMetadata {
        const now = new Date();
        const hour = now.getHours();
        
        let timeOfDay: "morning" | "afternoon" | "evening" | "night";
        if (hour < 6 || hour >= 22) timeOfDay = "night";
        else if (hour < 12) timeOfDay = "morning";
        else if (hour < 18) timeOfDay = "afternoon";
        else timeOfDay = "evening";

        const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
        const isEmergencyHours = hour < 6 || hour >= 22 || dayOfWeek === 'Saturday' || dayOfWeek === 'Sunday';

        return {
            timeOfDay,
            dayOfWeek,
            isEmergencyHours,
            conversationDuration: 0,
            messageCount: 0
        };
    }

    private calculateAge(birthDate: Date): number {
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

    async getPatientsByTherapist(therapistId: string): Promise<IServiceResponse> {
        try {
            const sessionDocs = await Session.find({ therapistId }, 'patientId').lean();
            const patientIds = [...new Set(sessionDocs.map(doc => doc.patientId))];

            if (patientIds.length === 0) {
                return {
                    success: true,
                    message: "No patients found for this therapist",
                    content: { patients: [] }
                };
            }

            const patients = await Promise.all(
                patientIds.map(async (patientId) => {
                    try {
                        const user = await User.findById(patientId, 'name photoUrl emailId').lean();
                        if (!user) return null;

                        const patient = await Patient.findOne({ userId: patientId }).lean();
                        if (!patient) return null;

                        return {
                            userId: patientId,
                            name: user.name,
                            photoUrl: user.photoUrl,
                            emailId: user.emailId,
                            gender: patient.gender,
                            age: patient.dateOfBirth ? this.calculateAge(patient.dateOfBirth) : null,
                            healthConditions: patient.healthConditions || [],
                            contact: patient.contact
                        };
                    } catch (err) {
                        console.error(`Error processing patient ${patientId}:`, err);
                        return null;
                    }
                })
            );

            const validPatients = patients.filter(Boolean);
            
            return {
                success: true,
                message: "Therapist's patients fetched successfully",
                content: { patients: validPatients }
            };

        } catch (error: any) {
            console.error(`  Error in getPatientsByTherapist for ${therapistId}:`, error);
            return {
                success: false,
                message: error?.message || "Failed to fetch therapist's patients",
                content: {}
            };
        }
    }
}

export const patientServices = new PatientServices();