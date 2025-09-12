import Chat from "../models/Chat.ts";
import User from "../models/User.ts";
import Mood from "../models/Mood.ts";
import Session from "../models/Session.ts";
import type { 
    IChatServices, 
    IServiceResponse, 
    ChatType, 
    IAIContext, 
    IUserProfile, 
    IConversationMessage, 
    ITherapeuticContext, 
    ISessionMetadata, 
    IAIResponse 
} from "../types/interfaces.ts";
import { getAiResponse, getEnhancedAIResponse } from "./aiServices.ts";
import { PATIENT_BOT_ENHANCED_PROMPT, THERAPIST_BOT_ENHANCED_PROMPT, AI_CONTEXT_LIMITS } from "../utils/constants.ts";

export class ChatServices implements IChatServices {
    async sendMessage(senderId: string, message: string, chatType: ChatType, receiverId?: string): Promise<IServiceResponse> {
        try {
            const sender = await User.findById(senderId, 'role').lean();
            if (!sender) {
                return {
                    success: false,
                    message: "Sender not found",
                    content: {}
                };
            }

            if (chatType === "patient-therapist") {
                if (!receiverId) {
                    return {
                        success: false,
                        message: "Receiver ID required for patient-therapist chat",
                        content: {}
                    };
                }
                
                const receiver = await User.findById(receiverId, 'role').lean();
                if (!receiver) {
                    return {
                        success: false,
                        message: "Receiver not found",
                        content: {}
                    };
                }

                const roles = [sender.role, receiver.role].sort();
                if (!(roles[0] === "patient" && roles[1] === "therapist")) {
                    return {
                        success: false,
                        message: "Invalid roles for patient-therapist chat",
                        content: {}
                    };
                }

                const chat = new Chat({
                    chatType,
                    senderId,
                    receiverId,
                    senderRole: sender.role,
                    message,
                    timestamp: new Date()
                });

                const savedChat = await chat.save();
                
                return {
                    success: true,
                    message: "Message sent successfully",
                    content: savedChat
                };
            }

            if (chatType === "patient-bot" || chatType === "therapist-bot") {
                const expectedRole = chatType === "patient-bot" ? "patient" : "therapist";
                if (sender.role !== expectedRole) {
                    return {
                        success: false,
                        message: `Invalid sender role for ${chatType} chat`,
                        content: {}
                    };
                }

                // Build AI context for enhanced response
                const aiContext = await this.buildAIContext(senderId, chatType);
                const enhancedResponse = await this.getEnhancedAIResponse(aiContext, message);

                if (!enhancedResponse) {
                    return {
                        success: false,
                        message: "Failed to get bot response",
                        content: {}
                    };
                }

                const chat = new Chat({
                    chatType,
                    senderId,
                    receiverId: null,
                    senderRole: sender.role,
                    message,
                    botResponse: JSON.stringify(enhancedResponse),
                    timestamp: new Date()
                });

                const savedChat = await chat.save();

                return {
                    success: true,
                    message: "Message sent and bot response received",
                    content: {
                        chat: savedChat,
                        parsedBotResponse: enhancedResponse
                    }
                };
            }

            return {
                success: false,
                message: "Invalid chat type",
                content: {}
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to send message",
                content: {}
            };
        }
    }

    async getPatientTherapistChats(patientId: string, therapistId: string): Promise<IServiceResponse> {
        try {
            const [patient, therapist] = await Promise.all([
                User.findOne({ _id: patientId, role: "patient" }, 'name photoUrl').lean(),
                User.findOne({ _id: therapistId, role: "therapist" }, 'name photoUrl').lean()
            ]);

            if (!patient || !therapist) {
                return {
                    success: false,
                    message: "Patient or therapist not found",
                    content: {}
                };
            }
            const chats = await Chat.find({
                chatType: "patient-therapist",
                $or: [
                    { senderId: patientId, receiverId: therapistId },
                    { senderId: therapistId, receiverId: patientId }
                ]
            })
            .sort({ timestamp: 1 })
            .lean();

            return {
                success: true,
                message: "Chat history retrieved successfully",
                content: {
                    chats,
                    patient: { id: patient._id, name: patient.name, photoUrl: patient.photoUrl },
                    therapist: { id: therapist._id, name: therapist.name, photoUrl: therapist.photoUrl }
                }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get chat history",
                content: {}
            };
        }
    }

    async getPatientBotChats(patientId: string): Promise<IServiceResponse> {
        try {
            const patient = await User.findOne({ _id: patientId, role: "patient" }, 'name').lean();
            if (!patient) {
                return {
                    success: false,
                    message: "Patient not found",
                    content: {}
                };
            }

            const chats = await Chat.find({
                chatType: "patient-bot",
                senderId: patientId
            })
            .sort({ timestamp: 1 })
            .lean();

            const chatsWithParsedResponses = chats.map(chat => ({
                ...chat,
                parsedBotResponse: chat.botResponse ? JSON.parse(chat.botResponse) : null
            }));

            return {
                success: true,
                message: "Patient-bot chat history retrieved successfully",
                content: {
                    chats: chatsWithParsedResponses,
                    patient: { id: patient._id, name: patient.name }
                }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get patient-bot chat history",
                content: {}
            };
        }
    }

    async getTherapistBotChats(therapistId: string): Promise<IServiceResponse> {
        try {
            const therapist = await User.findOne({ _id: therapistId, role: "therapist" }, 'name').lean();
            if (!therapist) {
                return {
                    success: false,
                    message: "Therapist not found",
                    content: {}
                };
            }

            const chats = await Chat.find({
                chatType: "therapist-bot",
                senderId: therapistId
            })
            .sort({ timestamp: 1 })
            .lean();

            const chatsWithParsedResponses = chats.map(chat => ({
                ...chat,
                parsedBotResponse: chat.botResponse ? JSON.parse(chat.botResponse) : null
            }));

            return {
                success: true,
                message: "Therapist-bot chat history retrieved successfully",
                content: {
                    chats: chatsWithParsedResponses,
                    therapist: { id: therapist._id, name: therapist.name }
                }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get therapist-bot chat history",
                content: {}
            };
        }
    }

    async markMessagesAsRead(userId: string, chatType: ChatType, partnerId?: string): Promise<IServiceResponse> {
        try {
            let updateQuery: any = {
                receiverId: userId,
                isRead: false
            };

            if (chatType === "patient-therapist" && partnerId) {
                updateQuery.senderId = partnerId;
                updateQuery.chatType = "patient-therapist";
            }

            const result = await Chat.updateMany(updateQuery, { isRead: true });

            return {
                success: true,
                message: `Marked ${result.modifiedCount} messages as read`,
                content: { updatedCount: result.modifiedCount }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to mark messages as read",
                content: {}
            };
        }
    }

    async getUnreadCount(userId: string): Promise<IServiceResponse> {
        try {
            const unreadCount = await Chat.countDocuments({
                receiverId: userId,
                isRead: false
            });

            return {
                success: true,
                message: "Unread count retrieved successfully",
                content: { unreadCount }
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "Failed to get unread count",
                content: {}
            };
        }
    }

    /**
     * Build comprehensive AI context for enhanced responses
     */
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
            
            // Determine system prompt based on chat type
            let systemPrompt = "";
            if (chatType === "patient-bot") {
                systemPrompt = PATIENT_BOT_ENHANCED_PROMPT;
            } else if (chatType === "therapist-bot") {
                systemPrompt = THERAPIST_BOT_ENHANCED_PROMPT;
            }

            return {
                userProfile,
                conversationHistory,
                therapeuticContext,
                sessionMetadata,
                systemPrompt
            };

        } catch (error: any) {
            console.error("Error building AI context:", error);
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
                systemPrompt: chatType === "patient-bot" ? PATIENT_BOT_ENHANCED_PROMPT : THERAPIST_BOT_ENHANCED_PROMPT
            };
        }
    }

    /**
     * Get enhanced AI response with full context
     */
    async getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse> {
        const enhancedResponse = await getEnhancedAIResponse(context, userMessage);
        
        if (!enhancedResponse) {
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
    }

    /**
     * Build user profile with mood trends and preferences
     */
    private async buildUserProfile(userId: string): Promise<IUserProfile> {
        const user = await User.findById(userId, 'name role').lean();
        if (!user) {
            return {
                userId,
                role: null,
                name: "Unknown User"
            };
        }

        // Get recent mood trend (last 7 days average)
        const recentMoods = await Mood.find({
            patientId: userId,
            createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }, 'moodLevel createdAt').lean() as any[];

        const recentMoodTrend = recentMoods.length > 0 
            ? recentMoods.reduce((sum, mood) => sum + mood.moodLevel, 0) / recentMoods.length
            : undefined;

        // Determine risk level based on mood trend and recent patterns
        let currentRiskLevel: "low" | "medium" | "high" | "critical" | undefined = "low";
        if (recentMoodTrend) {
            if (recentMoodTrend <= 3) currentRiskLevel = "high";
            else if (recentMoodTrend <= 5) currentRiskLevel = "medium";
        }

        const userProfile: IUserProfile = {
            userId,
            role: user.role,
            name: user.name
        };

        if (recentMoodTrend !== undefined) {
            userProfile.recentMoodTrend = Math.round(recentMoodTrend * 10) / 10;
        }
        
        if (currentRiskLevel !== undefined) {
            userProfile.currentRiskLevel = currentRiskLevel;
        }

        return userProfile;
    }

    /**
     * Get recent conversation history for context
     */
    private async getConversationHistory(senderId: string, chatType: ChatType, receiverId?: string): Promise<IConversationMessage[]> {
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
            .limit(AI_CONTEXT_LIMITS.RECENT_MESSAGES)
            .lean();

        return recentChats.map(chat => ({
            senderId: chat.senderId,
            senderRole: chat.senderRole,
            message: chat.message,
            timestamp: chat.timestamp,
            isFromBot: !!chat.botResponse
        })).reverse(); // Reverse to get chronological order
    }

    /**
     * Get therapeutic context including mood data and session info
     */
    private async getTherapeuticContext(senderId: string, receiverId?: string): Promise<ITherapeuticContext> {
        const context: ITherapeuticContext = {};

        // Get recent mood entries
        const cutoffDate = new Date(Date.now() - AI_CONTEXT_LIMITS.MOOD_ENTRIES_DAYS * 24 * 60 * 60 * 1000);
        const recentMoodEntries = await Mood.find({
            patientId: senderId,
            createdAt: { $gte: cutoffDate }
        }, 'moodLevel tags createdAt').lean();

        context.recentMoodEntries = recentMoodEntries.map(mood => ({
            moodLevel: mood.moodLevel,
            tags: mood.tags,
            timestamp: (mood as any).createdAt || new Date()
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

        if (sessionCount === 0) context.treatmentPhase = "initial";
        else if (sessionCount < 5) context.treatmentPhase = "active";
        else context.treatmentPhase = "maintenance";

        return context;
    }

    /**
     * Get current session metadata
     */
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
            conversationDuration: 0, // This would need to be tracked in session
            messageCount: 0 // This would need to be tracked in session
        };
    }
}

export const chatServices = new ChatServices();