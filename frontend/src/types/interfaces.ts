type Role = "admin" | "patient" | "therapist";


export interface IBackendResponse {
    message: string;
    content: Object;
    role: Role
}
export interface ILogin {
    emailId: string;
    password: string
}

export interface ISignup extends ILogin{
    name: string;
    confirmPassword: string;
    role: Role;
}


export interface IAuthServices {
    login(payload: ILogin): Promise<string>
    signup(payload: ISignup): Promise<string>
    logout(): Promise<string>
}



export interface IAlert {
    isError: boolean;
    message: string
}