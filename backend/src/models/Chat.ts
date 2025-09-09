import { model, Schema } from "mongoose";
import { type IChatMessage } from "../types/interfaces.ts";

const chatSchema = new Schema<IChatMessage>({
    userId: {
        type: String,
        required: true
    },
    userMessage: {
        type: String,
        required: true
    },
    botResponse: {
        type: String,
        required: true
    }
});

const Chat = model<IChatMessage>('Chat', chatSchema);

export default Chat;