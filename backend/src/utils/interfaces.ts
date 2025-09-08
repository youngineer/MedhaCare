export type Role = "patient" | "admin" | "therapist" | null;
export type Gender = "male" | "female";

// Response
export interface IResponse {
    message: string;
    content: Object;
    role: Role;
}

// auth types:
export interface ILoginRequest {
    emailId: string;
    password: string;
}

export interface ISignUpRequest extends ILoginRequest{
    name: string;
}


// User
export interface IUser extends ISignUpRequest{
    role: Role;
    photoUrl: string
}


// Patient
export interface IPatient extends IUser{
    userId: string;
    gender: Gender;
    dateOfBirth: Date;
    healthConditions: string[];
    contact: string;
}


// Therapist 
export interface ITherapist extends IUser {
    userId: string;
    bio: string;
    specialties: string[];
    ratePerSession: number;
    availability: Date[];
    rating: number
}


// Mood Logs
export interface IMood {
    patientId: string;
    moodLevel: number;
    tags: string[];
}


// ChatBot
export interface IChatMessage {
    userId: string;
    userMessage: string;
    botResponse: string
}

// Session
// export interface ISession {
//     dateTime: Date;
//     notes: string
//     patientId: 
// }