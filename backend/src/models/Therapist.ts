import { Schema, model } from 'mongoose';
import { type ITherapist } from '../types/interfaces.ts';
import { THERAPIST_BIO } from '../utils/constants.ts';

// Sub-schema for daily working hours
const workingHoursSchema = new Schema({
    start: { type: String, required: true },
    end: { type: String, required: true }
}, { _id: false });

// Sub-schema for weekly availability (each day uses the daily working hours schema)
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
    // Weekly working hours template
    workingHours: {
        type: availabilitySchema,
        default: {
            monday: { start: "09:00", end: "17:00" },
            tuesday: { start: "09:00", end: "17:00" },
            wednesday: { start: "09:00", end: "17:00" },
            thursday: { start: "09:00", end: "17:00" },
            friday: { start: "09:00", end: "17:00" },
            saturday: { start: "10:00", end: "14:00" },
            sunday: { start: "10:00", end: "14:00" }
        }
    },
    // Specific dates when therapist is unavailable
    daysOff: {
        type: [Date],
        default: []
    }
});

therapistSchema.index({ userId: 1 }, { unique: true });

const Therapist = model<ITherapist>('Therapist', therapistSchema);

export default Therapist;