import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL; 

export const searchSenderByServiceNo = async (serviceNo) => {
    if (!serviceNo) throw new Error('Service number is required');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${serviceNo}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Receiver not found');
        }
        throw new Error('Failed to search receiver');
    }
};

export const searchReceiverByServiceNo = async (serviceNo) => {
    if (!serviceNo) throw new Error('Service number is required');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${serviceNo}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('Receiver not found');
        }
        throw new Error('Failed to search receiver');
    }
};

export const createGatePassRequest = async (formData) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_BASE_URL}/requests`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create request');
    }
};

export const getGatePassRequest = async (employeeServiceNo) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/requests/${employeeServiceNo}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return Array.isArray(response.data) ? response.data : [response.data];
    } catch (error) {
        return [];  // Return empty array instead of throwing error
    }
};

export const getImageUrl = async (path) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/requests/image/${encodeURIComponent(path)}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data.url;
    } catch (error) {
        console.error('Error fetching image URL:', error);
        return null;
    }
};

export const getExecutiveOfficers = async (serviceNumber) => {
    try {
        const supervisors = await getSupervisors(serviceNumber);
        return supervisors;
    } catch (error) {
        console.error('Error fetching executive officers:', error);
        return [];
    }
};

export const updateExecutiveOfficer = async (requestId, executiveOfficerServiceNo) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(
            `${API_BASE_URL}/requests/${requestId}/executive`,
            { executiveOfficerServiceNo },
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to update executive officer');
    }
};


export const getLocations = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/admin/locations`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching locations:', error);
        return [];
    }
};

export const getCategories = async () => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/admin/categories`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const cancelRequest = async (referenceNumber) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_BASE_URL}/requests/${referenceNumber}/cancel`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error canceling request:', error);
        throw error;
    }
};

export const getSupervisors = async (serviceNumber) => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/users/supervisors/${serviceNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching supervisors:', error);
        return [];
    }
};


