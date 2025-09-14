import type { IBackendResponse, ITherapist, ITherapistServices } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";

const BASE_URL = BACKEND_URL + "/therapist";
export class TherapistServices implements ITherapistServices {
    async getAllTherapists(): Promise<IBackendResponse> {
        const url = BASE_URL + "/get";
        
        const request: Request = new Request(url, {
            method: 'GET',
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Therapist fetching failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async getTherapist(therapistId: string): Promise<IBackendResponse> {
        const url = therapistId? BASE_URL + "/get:" + therapistId :BASE_URL + "/get";
        
        const request: Request = new Request(url, {
            method: 'GET',
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Therapist fetching failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Therapist fetching error:', error);
            throw error;
        }
    }

    async updateTherapist(payload: Partial<ITherapist>): Promise<IBackendResponse> {
        const url = BASE_URL + "/update";
        
        const request: Request = new Request(url, {
            method: 'PATCH',
            body: JSON.stringify(payload),
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Update failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Update error:', error);
            throw error;
        }
    }
}


const therapistServices = new TherapistServices();
export default therapistServices;