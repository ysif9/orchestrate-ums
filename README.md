# orchestrate-ums

A comprehensive University Management System developed by Orchestrate, designed to streamline academic, administrative, and community processes using agile principles.

## Getting Started

These instructions will get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following software installed on your machine:

- **Docker** and **Docker Compose** - [Install Docker](https://docs.docker.com/desktop/setup/install/windows-install/)
- **Node.js** (v22 or higher recommended)
- **pnpm** (Package Manager) - for local development without Docker

If you do not have `pnpm` installed, you can install it globally via npm:

```bash
npm install -g pnpm
```

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ysif9/orchestrate-ums.git
   cd orchestrate-ums
   ```

## Running with Docker

The easiest way to run the project is using Docker Compose, which will set up all services automatically.

### Start the Application

Run the following command in the **root directory**:

```bash
# First time or after Dockerfile/dependency changes
docker compose up --build

# Subsequent runs
docker compose up
```

This will start:
- **Client (React):** `http://localhost:5173`
- **Server (Express):** `http://localhost:5000`
- **PostgreSQL Database:** `localhost:5433` (mapped from container port 5432)

### Stop the Application

```bash
docker compose down
```

To remove the database volume (this will delete all data):

```bash
docker compose down -v
```


## Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend:** Express 5, TypeScript, MikroORM
- **Database:** PostgreSQL 17
- **Containerization:** Docker, Docker Compose
