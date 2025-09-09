import type { IControllerResponse, Role } from "../types/interfaces.ts";

export const createResponse = (message: string, content: Object, role: Role): IControllerResponse => {
    return { message, content, role };
}