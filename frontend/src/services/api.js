import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes timeout for heavy solver operations
});

export const api = {
  // Trigger Solver
  triggerSolver: async () => {
    const response = await apiClient.post('/schedules/solver/generate/');
    return response.data;
  },

  // Get Schedules by Entity
  getCohortRoutine: async (cohortId) => {
    const response = await apiClient.get(`/schedules/cohort/${cohortId}/`);
    return response.data;
  },

  getFacultyRoutine: async (facultyId) => {
    const response = await apiClient.get(`/schedules/faculty/${facultyId}/`);
    return response.data;
  },

  getRoomRoutine: async (roomId) => {
    const response = await apiClient.get(`/schedules/room/${roomId}/`);
    return response.data;
  },

  // Manual Override with live conflict check
  overrideScheduleSlot: async (payload) => {
    const response = await apiClient.post('/schedules/override/', payload);
    return response.data;
  },

  // Ingestion: Upload Excel Workbook
  uploadMasterWorkbook: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/imports/master-workbook/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
