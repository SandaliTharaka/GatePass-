import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create a new status
export const createStatus = async (statusData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/dispatch/create`, statusData);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to create status');
    }
};

// Get all pending statuses
export const getPendingStatuses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/dispatch/pending`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch pending statuses');
    }
};


// Get all approved statuses
export const getApprovedStatuses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/dispatch/approved`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch approved statuses');
    }
};

// Get all rejected statuses
export const getRejectedStatuses = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/dispatch/rejected`);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch approved statuses');
    }
};  

// Approve a request (update status)
export const approveStatus = async (referenceNumber, comment) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/dispatch/${referenceNumber}/approve`, { comment });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to approve status');
    }
  };

// Reject a request (update status)
export const rejectStatus = async (referenceNumber, comment) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/dispatch/${referenceNumber}/reject`, { comment });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Failed to reject status');
    }
};

export const searchUserByServiceNo = async (serviceNo) => {
    if (!serviceNo) throw new Error('Service number is required');
    
    try {
        const response = await axios.get(`${API_BASE_URL}/users/${serviceNo}`);
        return response.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error('User not found');
        }
        throw new Error('Failed to search user');
    }
};