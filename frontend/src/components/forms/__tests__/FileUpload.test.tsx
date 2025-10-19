/**
 * Unit tests for FileUpload component
 * Tests file upload functionality, drag-and-drop, and validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../FileUpload';

// Mock API service
jest.mock('../../services/apiService', () => ({
  uploadFile: jest.fn(),
}));

import { uploadFile } from '../../services/apiService';

describe('FileUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders file upload component', () => {
    render(<FileUpload onUploadSuccess={() => {}} />);
    
    expect(screen.getByText(/upload/i)).toBeInTheDocument();
  });

  test('accepts CSV file upload', async () => {
    const mockOnSuccess = jest.fn();
    (uploadFile as jest.Mock).mockResolvedValue({
      sessionId: 'test-123',
      message: 'Success',
    });

    render(<FileUpload onUploadSuccess={mockOnSuccess} />);

    const file = new File(['Date,Revenue\n2024-01-01,10000'], 'test.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(uploadFile).toHaveBeenCalledWith(
        expect.any(FormData),
        expect.any(String)
      );
    });
  });

  test('rejects non-CSV files', () => {
    render(<FileUpload onUploadSuccess={() => {}} />);

    const file = new File(['test content'], 'test.txt', {
      type: 'text/plain',
    });

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    expect(screen.getByText(/only csv files/i)).toBeInTheDocument();
  });

  test('handles upload errors gracefully', async () => {
    (uploadFile as jest.Mock).mockRejectedValue(new Error('Upload failed'));

    render(<FileUpload onUploadSuccess={() => {}} />);

    const file = new File(['Date,Revenue\n2024-01-01,10000'], 'test.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });
  });

  test('displays upload progress', async () => {
    (uploadFile as jest.Mock).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<FileUpload onUploadSuccess={() => {}} />);

    const file = new File(['Date,Revenue\n2024-01-01,10000'], 'test.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText(/upload/i) as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
    });

    fireEvent.change(input);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
  });
});
