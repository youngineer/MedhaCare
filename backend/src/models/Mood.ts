import { model, Schema } from "mongoose";
import type { IMood } from "../types/interfaces.ts";


const moodSchema = new Schema<IMood> ({
    patientId: {
        type: String,
        ref: 'User',
        required: true
    },
    moodLevel: {
        type: Number,
        required: true,
        validate(value: number) {
            if(!(1 <= value && value <= 10)) throw new Error("Mood level should be between 1-10")
        }
    },
    tags: {
        type: [String],
    }
},
{timestamps: true});

const Mood = model<IMood>('Mood', moodSchema);

export default Mood;