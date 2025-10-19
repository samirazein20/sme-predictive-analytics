// API service for communicating with backend and ML services

export interface FileAnalysisResponse {
  success: boolean;
  message: string;
  sessionId: string;
  fileName: string;
  fileSize: number;
  rowCount: number;
  columnCount: number;
  columnNames: string[];
  basicStatistics: Record<string, any>;
  insights: DataInsight[];
  analysisType: string;
}

export interface DataInsight {
  type: string;
  title: string;
  description: string;
  value: string;
  category: string;
  confidence: number;
}

export interface AnalysisResult {
  trends: Record<string, any>;
  predictions: number[];
  insights: Array<{
    type: string;
    title: string;
    message: string;
    score: number;
    category: string;
  }>;
  charts_data: Record<string, any>;
  summary_stats: Record<string, any>;
}

class ApiService {
  private readonly backendUrl = 'http://localhost:8080';
  private readonly mlServiceUrl = 'http://localhost:8001';
  private readonly SESSION_STORAGE_KEY = 'sme_analytics_session';

  async uploadFile(file: File): Promise<FileAnalysisResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.backendUrl}/api/v1/data/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data: FileAnalysisResponse = await response.json();
    
    // Save session ID to localStorage
    if (data.success && data.sessionId) {
      this.saveSession(data.sessionId);
    }
    
    return data;
  }

  async getSession(sessionId: string): Promise<FileAnalysisResponse> {
    const response = await fetch(`${this.backendUrl}/api/v1/data/session/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`);
    }

    return response.json();
  }

  async getInsights(sessionId: string): Promise<DataInsight[]> {
    const response = await fetch(`${this.backendUrl}/api/v1/data/insights/${sessionId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to get insights: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeWithML(csvData: string, analysisType: string = 'auto'): Promise<AnalysisResult> {
    const response = await fetch(`${this.mlServiceUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: csvData,
        analysis_type: analysisType
      }),
    });

    if (!response.ok) {
      throw new Error(`ML analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async generatePredictions(data: number[], modelType: string = 'patchtst', horizon: number = 7) {
    const response = await fetch(`${this.mlServiceUrl}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data,
        model_type: modelType,
        horizon
      }),
    });

    if (!response.ok) {
      throw new Error(`Prediction failed: ${response.statusText}`);
    }

    return response.json();
  }

  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/v1/data/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkMLServiceHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.mlServiceUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Helper method to read file as text (for CSV files)
  readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  // Session management methods
  saveSession(sessionId: string): void {
    localStorage.setItem(this.SESSION_STORAGE_KEY, sessionId);
  }

  getSavedSessionId(): string | null {
    return localStorage.getItem(this.SESSION_STORAGE_KEY);
  }

  clearSession(): void {
    localStorage.removeItem(this.SESSION_STORAGE_KEY);
  }
}

export const apiService = new ApiService();