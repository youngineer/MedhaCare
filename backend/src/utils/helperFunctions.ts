import type { IResponse, Role } from "../types/interfaces.ts";

export const createResponse = (message: string, content: Object, role: Role): IResponse => {
    return { message, content, role };
}