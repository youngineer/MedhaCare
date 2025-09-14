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
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
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
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<string> {
        const url = BASE_URL + "/logout";

        const request: Request = new Request(url, {
            method: 'POST',
            headers: HEADER,
        });

        try {
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
};

const authServices = new AuthServices();
export default authServices;