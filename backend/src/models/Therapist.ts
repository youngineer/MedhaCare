import { Schema, model } from 'mongoose';
import { type ITherapist } from '../types/interfaces.ts';
import { THERAPIST_BIO } from '../utils/constants.ts';

const workingHoursSchema = new Schema({
    start: { type: String, required: true },
    end: { type: String, required: true }
}, { _id: false });

const availabilitySchema = new Schema({
    monday: workingHoursSchema,
    tuesday: workingHoursSchema,
    wednesday: workingHoursSchema,
    thursday: workingHoursSchema,
    friday: workingHoursSchema,
    saturday: workingHoursSchema,
    sunday: workingHoursSchema
}, { _id: false });

const therapistSchema = new Schema<ITherapist>({
    userId: {
        type: String,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: {
        type: String,
        default: THERAPIST_BIO
    },
    specialties: {
        type: [String],
        default: []
    },
    ratePerSession: {
        type: Number,
        default: 50,
        min: 0
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    workingHours: {
        type: availabilitySchema,
    },
    daysOff: {
        type: [Date],
        default: []
    }
});

therapistSchema.index({ userId: 1 }, { unique: true });

const Therapist = model<ITherapist>('Therapist', therapistSchema);

export default Therapist;