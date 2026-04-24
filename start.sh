#!/bin/bash

set -e

echo "=========================================="
echo "   AI Chatbot Builder - Startup Script"
echo "=========================================="

# Get project root directory
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load env
export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}

# --- Clean used ports ---
echo ""
echo "[1/6] Cleaning used ports ($BACKEND_PORT, $FRONTEND_PORT)..."
for PORT in $BACKEND_PORT $FRONTEND_PORT; do
  PID=$(lsof -ti :$PORT 2>/dev/null || true)
  if [ -n "$PID" ]; then
    echo "  Killing process on port $PORT (PID: $PID)"
    kill -9 $PID 2>/dev/null || true
    sleep 1
  fi
done
echo "  Ports cleaned."

# --- Check PostgreSQL ---
echo ""
echo "[2/6] Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
  echo "  ERROR: PostgreSQL is not installed. Please install it first."
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} > /dev/null 2>&1; then
  echo "  Starting PostgreSQL..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  else
    sudo systemctl start postgresql 2>/dev/null || true
  fi
  sleep 2
fi
echo "  PostgreSQL is running."

# --- Create database ---
echo ""
echo "[3/6] Setting up database..."
psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME:-aichatbotbuilder}'" | grep -q 1 || \
  psql -h ${DB_HOST:-localhost} -p ${DB_PORT:-5432} -U ${DB_USER:-postgres} -c "CREATE DATABASE ${DB_NAME:-aichatbotbuilder}" 2>/dev/null || true
echo "  Database ready."

# --- Install dependencies ---
echo ""
echo "[4/6] Installing dependencies..."
(cd "$PROJECT_DIR/backend" && npm install --silent 2>&1 | tail -1)
(cd "$PROJECT_DIR/frontend" && npm install --silent 2>&1 | tail -1)
echo "  Dependencies installed."

# --- Seed database ---
echo ""
echo "[5/6] Seeding database with sample data..."
(cd "$PROJECT_DIR/backend" && node seed.js)
echo "  Database seeded."

# --- Start services with hot reload ---
echo ""
echo "[6/6] Starting services with hot reload..."
echo "  Backend:  http://localhost:$BACKEND_PORT (nodemon - auto reload)"
echo "  Frontend: http://localhost:$FRONTEND_PORT (vite - HMR)"
echo ""
echo "=========================================="
echo "  App is starting! Open your browser at:"
echo "  http://localhost:$FRONTEND_PORT"
echo "=========================================="
echo ""
echo "Press Ctrl+C to stop all services."
echo ""

# Start backend with nodemon (watches for changes)
(cd "$PROJECT_DIR/backend" && npx nodemon server.js) &
BACKEND_PID=$!

# Start frontend with Vite (HMR - watches for changes)
(cd "$PROJECT_DIR/frontend" && npx vite --port $FRONTEND_PORT --host) &
FRONTEND_PID=$!

# Trap ctrl-c to kill both
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  # Clean ports
  for PORT in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti :$PORT 2>/dev/null || true)
    if [ -n "$PID" ]; then
      kill -9 $PID 2>/dev/null || true
    fi
  done
  echo "All services stopped."
  exit 0
}

trap cleanup SIGINT SIGTERM

wait
