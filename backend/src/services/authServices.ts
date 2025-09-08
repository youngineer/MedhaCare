import type { IResponse } from "../utils/interfaces.ts";
import bcrypt from "bcrypt";

export const hashPassword = async(password: string): Promise<string> => {
    return bcrypt.hashSync(password, 10);
}