
import bcrypt from "bcrypt";

export const hashPassword = (password: string): string => {
    return bcrypt.hashSync(password, 10);
}

export function verifyPassword(userPassword:string, hashedPassword: string): boolean {
    return bcrypt.compareSync(userPassword, hashedPassword);
}