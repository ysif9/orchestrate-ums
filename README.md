# orchestrate-ums

A comprehensive University Management System developed by Orchestrate, designed to streamline academic, administrative, and community processes using agile principles.

## Getting Started

These instructions will get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Ensure you have the following software installed on your machine:

- **Node.js** (v18 or higher recommended)
- **pnpm** (Package Manager)
- **MongoDB** (Local instance or Atlas connection string)

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

2. **Install dependencies**

   Since this is a monorepo, run the install command from the root directory. `pnpm` will handle dependencies for the root, server, and client simultaneously.

   ```bash
   pnpm install
   ```

### Configuration

You need to configure the environment variables for the backend server before running the application.

**Server Configuration**

   Navigate to the server directory and create a `.env` file:

   ```bash
   cd apps/server
   cp .env.example .env
   ```

   Open `apps/server/.env` and add the following configuration:

   ```text
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/orchestrate-ums
   # Add any other secrets (JWT_SECRET, etc.) here
   ```

### Running the Application

We use **concurrently** to run both the client (React) and server (Express) from the root directory.

1. **Start Development Server**

   Run the following command in the root directory:

   ```bash
   pnpm dev
   ```

   This command executes the scripts defined in the root `package.json`, effectively running:
    - **Server:** `http://localhost:5000`
    - **Client:** `http://localhost:5173` (default Vite port)

2. **Build for Production**

   To build the frontend for production:

   ```bash
   pnpm build
   ```