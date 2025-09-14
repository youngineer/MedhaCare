import type { IBackendResponse, IPatient, IPatientServices } from "../types/interfaces";
import { BACKEND_URL, HEADER } from "../utils/constants";

const BASE_URL = BACKEND_URL + "/patient";
export class PatientServices implements IPatientServices {
    async getAllPatients(): Promise<IBackendResponse> {
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
                throw new Error(errorData.message || 'Patient fetching failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Patient fetching error:', error);
            throw error;
        }
    }

    async getPatient(patientId: string): Promise<IBackendResponse> {
        const url = patientId? BASE_URL + "/get:" + patientId :BASE_URL + "/get";
        
        const request: Request = new Request(url, {
            method: 'GET',
            headers: HEADER,
            credentials: 'include'
        });

        try {
            const response: Response = await fetch(request);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Patient fetching failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Patient fetching error:', error);
            throw error;
        }
    }

    async updatePatient(payload: Partial<IPatient>): Promise<IBackendResponse> {
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


const patientServices = new PatientServices();
export default patientServices;