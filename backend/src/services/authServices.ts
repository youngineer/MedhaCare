
import bcrypt from "bcrypt";

export const hashPassword = async(password: string): Promise<string> => {
    return bcrypt.hashSync(password, 10);
}

export function verifyPassword(userPassword:string, hashedPassword: string): boolean {
    return bcrypt.compareSync(userPassword, hashedPassword);
}