import axios from 'axios';

// API base URLs
const API_BASE_URL = '/api';
const ML_API_BASE_URL = '/ml';

// Create axios instances
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

const mlApiClient = axios.create({
  baseURL: ML_API_BASE_URL,
  timeout: 30000,
});

// Types
export interface DataUploadResponse {
  id: string;
  filename: string;
  rows: number;
  columns: string[];
  status: 'uploaded' | 'processing' | 'ready' | 'error';
}

export interface PredictionRequest {
  dataId: string;
  targetColumn: string;
  predictionType: 'classification' | 'regression' | 'forecasting';
  parameters?: Record<string, any>;
}

export interface PredictionResponse {
  id: string;
  status: 'running' | 'completed' | 'failed';
  results?: any[];
  metrics?: Record<string, number>;
  visualizations?: string[];
}

// Data Services
export const dataService = {
  uploadFile: async (file: File): Promise<DataUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/data/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getDatasets: async (): Promise<DataUploadResponse[]> => {
    const response = await apiClient.get('/data/datasets');
    return response.data;
  },

  getDataPreview: async (dataId: string): Promise<any[]> => {
    const response = await apiClient.get(`/data/${dataId}/preview`);
    return response.data;
  },
};

// ML Services
export const mlService = {
  createPrediction: async (request: PredictionRequest): Promise<PredictionResponse> => {
    const response = await mlApiClient.post('/predictions', request);
    return response.data;
  },

  getPredictionStatus: async (predictionId: string): Promise<PredictionResponse> => {
    const response = await mlApiClient.get(`/predictions/${predictionId}`);
    return response.data;
  },

  getPredictions: async (): Promise<PredictionResponse[]> => {
    const response = await mlApiClient.get('/predictions');
    return response.data;
  },

  getModelInsights: async (predictionId: string): Promise<any> => {
    const response = await mlApiClient.get(`/predictions/${predictionId}/insights`);
    return response.data;
  },
};

// Health Check Services
export const healthService = {
  checkBackendHealth: async (): Promise<boolean> => {
    try {
      await apiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  },

  checkMLHealth: async (): Promise<boolean> => {
    try {
      await mlApiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  },
};