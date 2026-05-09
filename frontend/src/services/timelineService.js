import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const timelineService = {
  getStatusTimeline: async (referenceNumber) => {
    const response = await axios.get(`${API_URL}/timeline/${referenceNumber}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  },
};

export default timelineService;
