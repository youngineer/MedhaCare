import { model, Schema } from "mongoose";
import { type ISession } from "../types/interfaces.ts";

const sessionSchema = new Schema<ISession>({
    patientId: {
        type: String,
        ref: 'User',
        required: true
    },
    therapistId: {
        type: String,
        ref: 'User',
        required: true
    },
    dateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,
        default: 60,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'patientNoShow', 'therapistNoShow', 'cancelled'],
        default: 'pending',
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    bookingTime: {
        type: Date,
        default: Date.now
    },
    cancellationReason: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Compound index to prevent double booking
sessionSchema.index({ therapistId: 1, dateTime: 1 }, { unique: true });

// Index for querying patient's sessions
sessionSchema.index({ patientId: 1, dateTime: -1 });

// Index for querying therapist's sessions
sessionSchema.index({ therapistId: 1, dateTime: 1 });

const Session = model<ISession>('Session', sessionSchema);

export default Session;