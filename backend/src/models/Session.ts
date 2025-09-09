import { model, Schema } from "mongoose";
import { type ISession } from "../utils/interfaces.ts";

const sessionSchema = new Schema<ISession>({
    patientId: {
        type: String,
        required: true
    },
    therapistId: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    dateTime: {
        type: Date,
        required: true
    }
});


const Session = model<ISession>('Session', sessionSchema);

export default Session;