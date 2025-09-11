import { model, Schema } from "mongoose";
import { type IChat } from "../types/interfaces.ts";

const chatSchema = new Schema<IChat>({
    chatType: {
        type: String,
        enum: ["patient-therapist", "patient-bot", "therapist-bot"],
        required: true
    },
    senderId: {
        type: String,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: String,
        ref: 'User',
        required: false
    },
    senderRole: {
        type: String,
        enum: ["patient", "therapist"],
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    botResponse: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

chatSchema.index({ senderId: 1, timestamp: -1 });
chatSchema.index({ receiverId: 1, timestamp: -1 });
chatSchema.index({ chatType: 1, timestamp: -1 });
chatSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
chatSchema.index({ isRead: 1, receiverId: 1 });

const Chat = model<IChat>('Chat', chatSchema);

export default Chat;