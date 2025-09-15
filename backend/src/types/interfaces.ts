import type { IUserDocument } from "../models/User.ts";

export type Role = "patient" | "admin" | "therapist" | null;
export type Gender = "male" | "female";
export type SessionStatus = "pending" | "completed"| "patientNoShow" | "therapistNoShow" | "cancelled";



//Service Response
export interface IServiceResponse {
    success?: boolean;
    message: string;
    content: any;
}
// Response
export interface IControllerResponse extends IServiceResponse {
    role: Role;
}

// auth types:
export interface ILoginRequest extends Document {
    emailId: string;
    password: string;
}

export interface ISignUpRequest extends ILoginRequest{
    name: string;
    role: Role;
}

export interface ILoginResponse {
    success: boolean;
    message: string;
    role?: Role;
    token?: string;
}

export interface ISignUpResponse {
    success: boolean;
    message: string;
}

// Service interfaces
export interface IAuthService {
    signup(signupData: ISignUpRequest): Promise<ISignUpResponse>;
    login(loginData: ILoginRequest): Promise<IServiceResponse>;
}


// User
export interface IUser extends ISignUpRequest{
    _id?: string;
    role: Role;
    photoUrl?: string;
    authenticate(password: string): Promise<boolean>;
    getJWT(): string;
}


// Patient
export interface IPatient extends IUser{
    userId: string;
    gender: Gender;
    dateOfBirth: Date;
    healthConditions: string[];
    contact: string;
    aiReport: string | IAIResponse | { message: string }
}

// Patient services
export interface IPatientServices {
    getAllPatients(therapistId?: string): Promise<IServiceResponse>;
    getPatient(id: string): Promise<IServiceResponse>;
    updatePatient(id: string, payload: Partial<IPatient>): Promise<IServiceResponse>;
    deletePatient(id: string): Promise<IServiceResponse>;
    generateSummary(id: string): Promise<IServiceResponse>;
    buildAIContext(senderId: string, chatType: ChatType, receiverId?: string): Promise<IAIContext>;
    getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse>;
}



// Working hours for a single day
export interface IWorkingHours {
    start: string; // "09:00"
    end: string;   // "17:00"
}

// Weekly availability template
export interface IWeeklyAvailability {
    monday: IWorkingHours;
    tuesday: IWorkingHours;
    wednesday: IWorkingHours;
    thursday: IWorkingHours;
    friday: IWorkingHours;
    saturday: IWorkingHours;
    sunday: IWorkingHours;
}

// Therapist 
export interface ITherapist extends IUser {
    userId: string;
    bio: string;
    specialties: string[];
    ratePerSession: number;
    workingHours: IWeeklyAvailability;
    daysOff: Date[];
    rating: number;
}


// Therapist services
export interface ITherapistServices {
    getAllTherapists(): Promise<IServiceResponse>;
    getTherapist(id: string): Promise<IServiceResponse>;
    updateTherapist(id: string, payload: Partial<ITherapist>): Promise<IServiceResponse>;
    deleteTherapist(id: string): Promise<IServiceResponse>;
}


export interface IUserDto extends Partial<IUser> {
    gender?: Gender;
    dateOfBirth?: Date;
    healthConditions?: string[];
    contact?: string;
    aiReport?: string | IAIResponse | { message: string };
    bio?: string;
    specialties?: string[];
    ratePerSession?: number;
    workingHours?: IWeeklyAvailability;
    daysOff?: Date[];
    rating?: number;
}

// Mood Logs
export interface IMood extends Document {
    patientId: string;
    moodLevel: number;
    tags: string[];
}


export interface IMoodServices {
    addMood(payload: IMood, user: IUserDocument): Promise<IServiceResponse>;
    getMoods(user: IUserDocument, patientId: string): Promise<IServiceResponse>;
    getMood(moodId: string): Promise<IServiceResponse>;
    deleteMood(moodId: string, user: IUserDocument): Promise<IServiceResponse>;
}


// Chat Types
export type ChatType = "patient-therapist" | "patient-bot" | "therapist-bot";

// Chat Interface
export interface IChat extends Document {
    _id?: string;
    chatType: ChatType;
    senderId: string; // userId of sender
    receiverId?: string; // userId of receiver (null for bot)
    senderRole: Role; // "patient" | "therapist"
    message: string;
    botResponse?: string; // Only present when chatType involves bot
    timestamp: Date;
    isRead?: boolean;
}

// Enhanced AI Context Interfaces
export interface IAIContext {
    userProfile: IUserProfile;
    conversationHistory: IConversationMessage[];
    therapeuticContext: ITherapeuticContext;
    sessionMetadata: ISessionMetadata;
    systemPrompt: string;
}

export interface IUserProfile {
    userId: string;
    role: Role;
    name: string;
    recentMoodTrend?: number; // Average mood from last 7 days
    currentRiskLevel?: "low" | "medium" | "high" | "critical";
    preferredCommunicationStyle?: "direct" | "gentle" | "structured" | "casual";
    therapeuticGoals?: string[];
}

export interface IConversationMessage {
    senderId: string;
    senderRole: Role;
    message: string;
    timestamp: Date;
    emotionalTone?: "positive" | "negative" | "neutral" | "distressed" | "hopeful";
    isFromBot?: boolean;
}

export interface ITherapeuticContext {
    currentSessionId?: string;
    therapistId?: string; // For patient-bot chats, include assigned therapist
    recentMoodEntries?: IMoodContext[];
    upcomingAppointments?: Date[];
    lastTherapySession?: Date;
    treatmentPhase?: "initial" | "active" | "maintenance" | "crisis";
}

export interface IMoodContext {
    moodLevel: number;
    tags: string[];
    timestamp: Date;
    notes?: string;
}

export interface ISessionMetadata {
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
    dayOfWeek: string;
    isEmergencyHours: boolean;
    conversationDuration: number; // minutes
    messageCount: number;
}

export interface IAIResponse {
    response: string;
    responseType: "supportive" | "educational" | "crisis" | "referral" | "check_in";
    emotionalTone: "empathetic" | "encouraging" | "calm" | "urgent";
    confidenceScore: number;
    flagsForTherapist?: string[];
    suggestedFollowUp?: string;
    escalationRequired?: boolean;
}

export interface IChatServices {
    // Send message (handles all three types)
    sendMessage(senderId: string, message: string, chatType: ChatType, receiverId?: string): Promise<IServiceResponse>;
    
    // Get chat history for different interfaces
    getPatientTherapistChats(patientId: string, therapistId: string): Promise<IServiceResponse>;
    getPatientBotChats(patientId: string): Promise<IServiceResponse>;
    getTherapistBotChats(therapistId: string): Promise<IServiceResponse>;
    
    // Mark messages as read
    markMessagesAsRead(userId: string, chatType: ChatType, partnerId?: string): Promise<IServiceResponse>;
    
    // Get unread message count
    getUnreadCount(userId: string): Promise<IServiceResponse>;
    
    // Enhanced AI context methods
    buildAIContext(senderId: string, chatType: ChatType, receiverId?: string): Promise<IAIContext>;
    getEnhancedAIResponse(context: IAIContext, userMessage: string): Promise<IAIResponse>;
}


// Session
export interface ISession extends Document {
    _id?: string;
    patientId: string;
    therapistId: string;
    dateTime: Date;
    duration: number; // in minutes
    status: SessionStatus;
    notes: string;
    bookingTime?: Date;
    cancellationReason?: string;
}

// Session services
export interface ISessionServices {
    getAvailableSlots(therapistId: string, date: Date): Promise<IServiceResponse>;
    postSession(patientId: string, payload: ISession): Promise<IServiceResponse>;
    getAllSessions(): Promise<IServiceResponse>;
    getSession(id: string): Promise<IServiceResponse>;
    updateSession(id: string, payload: Partial<ISession>): Promise<IServiceResponse>;
    deleteSession(id: string): Promise<IServiceResponse>;
    cancelSession(sessionId: string, cancellationReason?: string): Promise<IServiceResponse>;
}