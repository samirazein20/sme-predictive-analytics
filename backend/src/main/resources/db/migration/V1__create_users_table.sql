-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    company_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- Insert default admin user (password: admin123 - hashed with BCrypt)
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@smeanalytics.com', '$2a$10$VPNz3WZ.TqKVHQJQVqG3iOvJLj7r7xXx8BqG3TqKVHQJQVqG3iOvJLj', 'System Administrator', 'ADMIN');
