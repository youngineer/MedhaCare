
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Therapist from "../models/Therapist.js";
import type { 
    IAuthService, 
    ILoginRequest, 
    ISignUpRequest, 
    ILoginResponse, 
    ISignUpResponse 
} from "../types/interfaces.ts";

export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 10);
}

export function verifyPassword(userPassword:string, hashedPassword: string): boolean {
    return bcrypt.compareSync(userPassword, hashedPassword);
}

export class AuthService implements IAuthService {
    
    async signup(signupData: ISignUpRequest): Promise<ISignUpResponse> {
        try {
            const { name, emailId, password, role } = signupData;
            
            // Check if user already exists
            const existingUser = await User.findOne({ emailId });
            if (existingUser) {
                return {
                    success: false,
                    message: "Email already registered"
                };
            }

            // Create new user
            const user = new User({
                name,
                emailId,
                password: hashPassword(password),
                role
            });

            const savedUser = await user.save();
            if (!savedUser) {
                return {
                    success: false,
                    message: "Could not save user. Try again"
                };
            }

            // Create role-specific profile
            if (role === "patient") {
                const patient = new Patient({
                    userId: savedUser.id
                });

                const savedPatient = await patient.save();
                if (!savedPatient) {
                    // Cleanup user if patient creation fails
                    await User.findByIdAndDelete(savedUser.id);
                    return {
                        success: false,
                        message: "Could not create patient profile. Try again"
                    };
                }
            } else if (role === "therapist") {
                const therapist = new Therapist({
                    userId: savedUser.id
                });

                const savedTherapist = await therapist.save();
                if (!savedTherapist) {
                    // Cleanup user if therapist creation fails
                    await User.findByIdAndDelete(savedUser.id);
                    return {
                        success: false,
                        message: "Could not create therapist profile. Try again"
                    };
                }
            }

            return {
                success: true,
                message: "User created successfully!"
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "An error occurred during signup"
            };
        }
    }

    async login(loginData: ILoginRequest): Promise<ILoginResponse> {
        try {
            const { emailId, password } = loginData;
            
            const user = await User.findOne({ emailId });
            
            if (!user || !user.password) {
                return {
                    success: false,
                    message: "Invalid login credentials",
                    token: ""
                };
            }

            const isPasswordValid = await user.authenticate(password);
            if (!isPasswordValid) {
                return {
                    success: false,
                    message: "Invalid credentials",
                    token: ""
                };
            }

            const token: string = user.getJWT();

            return {
                success: true,
                message: "Login successful!",
                role: user?.role,
                token: token
            };

        } catch (error: any) {
            return {
                success: false,
                message: error.message || "An error occurred during login"
            };
        }
    }
}

export const authService = new AuthService();