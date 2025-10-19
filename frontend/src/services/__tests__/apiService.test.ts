/**
 * Unit tests for API Service
 * Tests HTTP requests, error handling, and session management
 */

import axios from 'axios';
import { uploadFile, getInsights, getSession } from '../apiService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    test('successfully uploads file', async () => {
      const mockResponse = {
        data: {
          sessionId: 'test-123',
          message: 'File uploaded successfully',
        },
      };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.csv');

      const result = await uploadFile(formData, 'session-123');

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/upload'),
        formData,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    test('handles upload error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      const formData = new FormData();
      
      await expect(uploadFile(formData, 'session-123')).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('getInsights', () => {
    test('successfully retrieves insights', async () => {
      const mockInsights = {
        data: {
          totalRevenue: 50000,
          totalExpenses: 25000,
          profitMargin: 50,
        },
      };
      mockedAxios.get.mockResolvedValue(mockInsights);

      const result = await getInsights('session-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/insights/session-123')
      );
      expect(result).toEqual(mockInsights.data);
    });

    test('handles 404 error for missing session', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 404 },
      });

      await expect(getInsights('invalid-session')).rejects.toBeTruthy();
    });
  });

  describe('getSession', () => {
    test('successfully retrieves session data', async () => {
      const mockSession = {
        data: {
          sessionId: 'session-123',
          status: 'active',
          createdAt: '2024-10-18T10:00:00',
        },
      };
      mockedAxios.get.mockResolvedValue(mockSession);

      const result = await getSession('session-123');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/data/session/session-123')
      );
      expect(result).toEqual(mockSession.data);
    });
  });
});
