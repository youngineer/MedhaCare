import type { IAuthServices, IBackendResponse, ILogin, ISignup } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";


const BASE_URL = BACKEND_URL + "/auth";

export class AuthServices implements IAuthServices {
    async signup(payload: ISignup): Promise<string> {
        const url = BASE_URL + "/signup";

        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: HEADER,
        });

        try {
            const asyncResponse: Response = await fetch(request);
            const response: IBackendResponse = await asyncResponse.json();

            if(!asyncResponse.ok) {
                return Promise.reject(response.message || 'Signup failed. Please try again');
            } else {
                return response.message;
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }


    async login(payload: ILogin) {
        const url = BASE_URL + "/login";
        console.log(url);
        console.log(payload);

        return "Login called"

        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: HEADER,
        });

        try {
            const asyncResponse: Response = await fetch(request);
            const response: IBackendResponse = await asyncResponse.json();

            if(!asyncResponse.ok) {
                return Promise.reject(response.message || 'Login failed. Please try again');
            } else {
                return response.message;
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }

    async logout(): Promise<string> {
        const url = BASE_URL + "/logout";

        const request: Request = new Request(url, {
            method: 'POST',
            headers: HEADER,
        });

        try {
            const asyncResponse: Response = await fetch(request);
            const response: IBackendResponse = await asyncResponse.json();

            if(!asyncResponse.ok) {
                return Promise.reject(response.message || 'Logout failed. Please try again');
            } else {
                return response.message;
            }
        } catch (error: any) {
            return Promise.reject(error);
        }
    }
};

const authServices = new AuthServices();
export default authServices;