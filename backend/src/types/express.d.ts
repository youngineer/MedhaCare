declare global {
    namespace Express {
        interface Request {
            user?: import("../utils/interfaces").IUser | null;
        }
    }
}

export {};
