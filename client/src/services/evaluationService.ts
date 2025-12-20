import { authService } from './authService';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api') + '/evaluations';
console.log('Evaluation Service API_URL:', API_URL);

export const evaluationService = {
    getMyEvaluations: async () => {
        const user = authService.getCurrentUser();
        if (!user) return [];
        const response = await fetch(`${API_URL}/my-evaluations?userId=${user.id}`, {
            headers: {
                Authorization: `Bearer ${authService.getToken()}`,
            },
        });
        if (!response.ok) {
            // Try to parse error message from JSON response
            let errorMessage = 'Failed to fetch evaluations';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
            }
            throw new Error(errorMessage);
        }

        // Ensure response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check server logs.');
        }

        return response.json();
    },

    getFacultyEvaluations: async (facultyId) => {
        const response = await fetch(`${API_URL}/faculty/${facultyId}`, {
            headers: {
                Authorization: `Bearer ${authService.getToken()}`,
            },
        });
        if (!response.ok) {
            // Try to parse error message from JSON response
            let errorMessage = 'Failed to fetch evaluations';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
            }
            throw new Error(errorMessage);
        }

        // Ensure response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check server logs.');
        }

        return response.json();
    },

    createEvaluation: async (data: any) => {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authService.getToken()}`,
            },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            // Try to parse error message from JSON response
            let errorMessage = 'Failed to create evaluation';
            let detailedError = '';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                detailedError = errorData.error ? ` - ${errorData.error}` : '';
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = `${errorMessage} (${response.status} ${response.statusText})`;
            }
            throw new Error(errorMessage + detailedError);
        }

        // Ensure response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Server returned non-JSON response. Please check server logs.');
        }

        return response.json();
    },
};
