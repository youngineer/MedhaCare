import { Schema, model } from 'mongoose';
import validator from 'validator';
import User from './User.js';
import { type ITherapist } from '../utils/interfaces.ts';
import { THERAPIST_BIO } from '../utils/constants.ts';

const therapistSchema = new Schema<ITherapist>({
    userId: {
        type: String,
        ref: User,
        required: true,
        unique: true
    },
    bio: {
        default: THERAPIST_BIO,
        type: String
    },
    specialties: {
        type: [String],
        default: [] as string[],
    },
    rating: {
        type: Number,
        default: 0,
        validate(value: string) {
            if(!validator.isInt(value, {min: 0, max: 10})) {
                throw new Error("Rating should be between [0-10]");
            }
        }
    },
    ratePerSession: {
        type: Number,
        default: 0,
        validate(value: string) {
            if(!validator.isDecimal(value)) {
                throw new Error("Rate should be a decimal");
            }
        }
    },
    availability: {
        type: [Date],
        default: [] as Date[]
    }
},
{ timestamps: true });

therapistSchema.index({ userId: 1 }, { unique: true, name: 'idx_therapist_userId' });


const Therapist = model<ITherapist>('Patient', therapistSchema);


export default Therapist;