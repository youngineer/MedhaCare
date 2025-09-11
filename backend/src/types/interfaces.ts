import type { IUserDocument } from "../models/User.ts";

export type Role = "patient" | "admin" | "therapist" | null;
export type Gender = "male" | "female";
export type SessionStatus = "pending" | "completed"| "patientNoShow" | "therapistNoShow" | "cancelled";



//Service Response
export interface IServiceResponse {
    success?: boolean;
    message: string;
    content: Object;
}
// Response
export interface IControllerResponse extends IServiceResponse {
    role: Role;
}

// auth types:
export interface ILoginRequest {
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
    login(loginData: ILoginRequest): Promise<ILoginResponse>;
}


// User
export interface IUser extends ISignUpRequest{
    _id?: string;
    role: Role;
    photoUrl: string;
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
}

// Patient services
export interface IPatientServices {
    getAllPatients(): Promise<IServiceResponse>;
    getPatient(id: string): Promise<IServiceResponse>;
    updatePatient(id: string, payload: Partial<IPatient>): Promise<IServiceResponse>;
    deletePatient(id: string): Promise<IServiceResponse>;
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


// Mood Logs
export interface IMood {
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


// ChatBot
export interface IChatMessage {
    userId: string;
    userMessage: string;
    botResponse: string
}


// Session
export interface ISession {
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