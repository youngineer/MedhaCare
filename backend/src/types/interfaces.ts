export type Role = "patient" | "admin" | "therapist" | null;
export type Gender = "male" | "female";
export type SessionStatus = "pending" | "completed"| "patientNoShow" | "therapistNoShow";



//Service Response
export interface IServiceResponse {
    status?: boolean;
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


// Therapist 
export interface ITherapist extends IUser {
    userId: string;
    bio: string;
    specialties: string[];
    ratePerSession: number;
    availability: Date[];
    rating: number
}


// Therapist services
export interface ITherapistServices {
    getAllTherapists(): Promise<IServiceResponse>;
    getTherapist(id: string): Promise<IServiceResponse>
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
export interface ISession {
    dateTime: Date;
    notes: string
    patientId: string;
    therapistId: string;
    status: SessionStatus
}