import type { IAuthServices, IBackendResponse, ILogin, ISignup } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";

const BASE_URL = BACKEND_URL + "/auth";


export class AuthServices implements IAuthServices {
    async signup(payload: ISignup): Promise<IBackendResponse> {
        const url = BASE_URL + "/signup";

        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: HEADER
        });

        try {
            const response: Response = await fetch(request);
            const backendResponse: IBackendResponse = await response.json();

            if (!response.ok) {
                throw new Error(backendResponse.message || 'Signup failed');
            }

            return backendResponse;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    }

    async login(payload: ILogin): Promise<IBackendResponse> {
        const url = BASE_URL + "/login";
        console.log(payload)
        console.log(JSON.stringify(payload), typeof JSON.stringify(payload))

        const request: Request = new Request(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: HEADER
        });

        try {
            const response: Response = await fetch(request);
            const backendResponse: IBackendResponse = await response.json();

            if (!response.ok) {
                throw new Error(backendResponse.message || 'Login failed');
            }

            return backendResponse;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout(): Promise<IBackendResponse> {
        const url = BASE_URL + "/logout";

        const request: Request = new Request(url, {
            method: 'POST',
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);
            const backendResponse: IBackendResponse = await response.json();

            if (!response.ok) {
                throw new Error(backendResponse.message || 'Logout failed');
            }

            return backendResponse;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }
}

const authServices = new AuthServices();
export default authServices;