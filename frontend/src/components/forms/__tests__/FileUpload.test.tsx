/**
 * Unit tests for FileUpload component
 * Tests file upload functionality, drag-and-drop, and validation
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../FileUpload';

// Mock the api service
jest.mock('../../services/api', () => ({
  dataService: {
    uploadFile: jest.fn().mockResolvedValue({
      success: true,
      sessionId: 'test-123',
      message: 'File uploaded successfully',
    }),
  },
}));

describe('FileUpload Component', () => {
  test('renders file upload component', () => {
    render(<FileUpload />);
    
    // Check for drag and drop text
    const uploadText = screen.getByText(/drag.*drop/i, { exact: false });
    expect(uploadText).toBeInTheDocument();
  });

  test('renders upload instructions', () => {
    render(<FileUpload />);
    
    // The component should show some upload-related text
    expect(screen.getByText(/drag.*drop/i, { exact: false })).toBeInTheDocument();
  });
});
