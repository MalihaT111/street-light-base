# Street Light Base - Development Commands

# Default: show available commands
default:
    @just --list

# Run both backend and frontend concurrently
dev:
    @echo "Starting backend and frontend..."
    just backend & just frontend & wait

# Run the Flask backend
backend:
    cd Backend && python app.py

# Run the Vite frontend
frontend:
    cd Frontend && npm run dev

# Install all dependencies
install:
    cd Frontend && npm install

# Build the frontend for production
build:
    cd Frontend && npm run build

# Lint the frontend
lint:
    cd Frontend && npm run lint
