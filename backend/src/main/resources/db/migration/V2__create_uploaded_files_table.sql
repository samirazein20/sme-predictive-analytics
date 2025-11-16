-- Create uploaded_files table to persist file uploads and their analysis results
CREATE TABLE uploaded_files (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    session_id VARCHAR(36) UNIQUE NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(10) NOT NULL,
    file_size BIGINT NOT NULL,
    file_path TEXT,
    file_content TEXT, -- Store CSV content for analysis
    analysis_type VARCHAR(50),
    row_count INTEGER,
    column_count INTEGER,
    insights JSONB, -- Store DataInsight objects as JSON
    statistics JSONB, -- Store column statistics as JSON
    predictions JSONB, -- Store prediction results as JSON
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    analyzed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX idx_uploaded_files_user_id ON uploaded_files(user_id);
CREATE INDEX idx_uploaded_files_session_id ON uploaded_files(session_id);
CREATE INDEX idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at);
