/**
 * Unit tests for API Service
 * Tests HTTP requests, error handling, and session management
 */

import { apiService } from '../apiService';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('uploadFile', () => {
    test('successfully uploads file', async () => {
      const mockResponse = {
        success: true,
        sessionId: 'test-123',
        message: 'File uploaded successfully',
        fileName: 'test.csv',
        fileSize: 1024,
        rowCount: 10,
        columnCount: 5,
        columnNames: ['col1', 'col2'],
        basicStatistics: {},
        insights: [],
        analysisType: 'general'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      const result = await apiService.uploadFile(file);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/upload'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('handles upload error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Network error',
      });

      const file = new File(['test'], 'test.csv', { type: 'text/csv' });
      
      await expect(apiService.uploadFile(file)).rejects.toThrow(
        'Upload failed: Network error'
      );
    });
  });

  describe('getInsights', () => {
    test('successfully retrieves insights', async () => {
      const mockInsights = [
        {
          type: 'revenue',
          title: 'Revenue Trend',
          description: 'Revenue is increasing',
          value: '50000',
          category: 'financial',
          confidence: 0.9
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockInsights,
      });

      const result = await apiService.getInsights('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/insights/session-123')
      );
      expect(result).toEqual(mockInsights);
    });

    test('handles 404 error for missing session', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      await expect(apiService.getInsights('invalid-session')).rejects.toThrow(
        'Failed to get insights: Not Found'
      );
    });
  });

  describe('getSession', () => {
    test('successfully retrieves session data', async () => {
      const mockSession = {
        success: true,
        sessionId: 'session-123',
        message: 'Session retrieved',
        fileName: 'test.csv',
        fileSize: 1024,
        rowCount: 10,
        columnCount: 5,
        columnNames: ['col1', 'col2'],
        basicStatistics: {},
        insights: [],
        analysisType: 'general'
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockSession,
      });

      const result = await apiService.getSession('session-123');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/session/session-123')
      );
      expect(result).toEqual(mockSession);
    });
  });
});
