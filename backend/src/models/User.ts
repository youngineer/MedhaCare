import { model, Schema, type Document } from "mongoose";
import type { IUser } from "../types/interfaces.ts";
import validator from 'validator';
import { DEFAULT_PHOTO_URL } from "../utils/constants.ts";
import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';
dotenv.config();


export interface IUserDocument extends Document, Omit<IUser, '_id'> {}

const userSchema = new Schema<IUserDocument>({
    name: {
        type: String, 
        required: true,
        trim: true,
        validate: (value: string) => {
            if(!validator.isAlpha(value, 'en-US', { ignore: ' ' })) {
                throw new Error("Invalid name - only letters and spaces allowed");
            }
        }
    },
    emailId: {
        type: String, 
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        validate(value: string) {
            if(!validator.isEmail(value)) {
                throw new Error("Invalid email address");
            }
        }
    },
    password: {
        type: String, 
        required: true
    },
    role: {
        type: String, 
        required: true, 
        enum: ['therapist', 'admin', 'patient'], 
        message: '{VALUE} is not supported',
    },

    photoUrl: {
        type: String,
        default: DEFAULT_PHOTO_URL,
        validate(value: string) {
            if(!validator.isURL(value)) {
                throw new Error("Invalid image url");
            }
        }
    }
    },
    { timestamps: true }
);

userSchema.methods.getJWT = function(this: IUserDocument): string {
    const user = this;
    const secret: string = process.env.JWT_SECRET as string;
    const token: string = jwt.sign({ _id: user._id }, secret);
    return token;
};

userSchema.methods.authenticate = async function(this: IUserDocument, userPassword: string):Promise<boolean> {
    const user = this;
    const userPasswordHash: string = user?.password as string;

    return await bcrypt.compare(userPassword, userPasswordHash);
};

const User = model<IUserDocument>('User', userSchema);

export default User;