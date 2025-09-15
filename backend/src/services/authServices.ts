import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken'
import type { 
    IAuthService, 
    ILoginRequest, 
    ISignUpRequest, 
    ILoginResponse, 
    ISignUpResponse, 
    IServiceResponse,
    IPatient,
    IUserDto
} from "../types/interfaces.ts";
import User from "../models/User.ts";
import Patient from "../models/Patient.ts";
import Therapist from "../models/Therapist.ts";
import { DEFAULT_PHOTO_URL, PATIENT_PHOTO_URL, THERAPIST_BIO, THERAPIST_PHOTO_URL } from "../utils/constants.ts";

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
            
            let photoUrl: string = DEFAULT_PHOTO_URL;
            if(role === 'patient') {
                photoUrl = PATIENT_PHOTO_URL;
            } else if(role === 'therapist') {
                photoUrl = THERAPIST_PHOTO_URL;
            }

            // Create new user
            const user = new User({
                name,
                emailId,
                password: hashPassword(password),
                role,
                photoUrl: photoUrl
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

    async login(loginData: ILoginRequest): Promise<IServiceResponse> {
        try {
            const { emailId, password } = loginData;
            
            // fetch user (ensure model method 'authenticate' and 'getJWT' exist)
            const user = await User.findOne({ emailId }).select('+password');
            
            if (!user) {
                return {
                    success: false,
                    message: "Invalid login credentials",
                    content: {}
                };
            }

            // Prefer model's authenticate if available, otherwise compare manually
            let isPasswordValid = false;
            if (typeof (user as any).authenticate === 'function') {
                isPasswordValid = await (user as any).authenticate(password);
            } else if (user.password) {
                isPasswordValid = verifyPassword(password, user.password);
            }

            if (!isPasswordValid) {
                return {
                    success: false,
                    message: "Invalid credentials",
                    content: {}
                };
            }

            // Generate token via model helper if available, else sign directly
            let token: string;
            if (typeof (user as any).getJWT === 'function') {
                token = (user as any).getJWT();
            } else {
                const jwtSecret = process.env.JWT_SECRET || 'change_this_secret';
                token = jwt.sign({ _id: user._id, role: user.role }, jwtSecret, { expiresIn: '24h' });
            }

            // Build safe user DTO
            const baseUser = {
                _id: user._id,
                name: user.name,
                emailId: user.emailId,
                role: user.role,
                photoUrl: (user as any).photoUrl || DEFAULT_PHOTO_URL
            } as IUserDto;

            // Fetch role-specific profile and merge
            let profile: Partial<IUserDto> | null = null;
            if (user.role === 'patient') {
                profile = await Patient.findOne({ userId: user._id }).lean().select('gender dateOfBirth contact healthConditions aiReport') as Partial<IUserDto> | null;
            } else if (user.role === 'therapist') {
                profile = await Therapist.findOne({ userId: user._id }).lean().select('bio specialties ratePerSession rating workingHours daysOff') as Partial<IUserDto> | null;
            }

            const combinedUser = { ...baseUser, ...(profile || {}) };

            return {
                success: true,
                message: "Login successful!",
                content: {
                    token,
                    user: combinedUser,
                    role: user.role
                }
            };

        } catch (error: any) {
            console.error("authService.login error:", error);
            return {
                success: false,
                message: error.message || "An error occurred during login",
                content: {}
            };
        }
    }
}

export const authService = new AuthService();