<div align="center">

# 🎓 Orchestrate UMS

### A Comprehensive University Management System

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-000000)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)](https://www.docker.com/)
[![pnpm](https://img.shields.io/badge/pnpm-10.22.0-F69220)](https://pnpm.io/)

*Streamlining academic, administrative, and community processes using modern web technologies and agile principles*

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

## 📑 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Development](#-development)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Authors](#-authors)
- [Support](#-support)

## 🎯 Overview

**Orchestrate UMS** is a full-stack University Management System designed to digitize and streamline the complex
operations of educational institutions. Built with modern technologies and following best practices, it provides a
comprehensive solution for managing students, faculty, courses, admissions, facilities, and administrative processes.

### Why Orchestrate UMS?

- **🚀 Modern Tech Stack**: Built with React 19, Express 5, TypeScript, and PostgreSQL
- **🐳 Docker-Ready**: Fully containerized for easy deployment and development
- **🔐 Secure**: JWT-based authentication with role-based access control
- **📱 Responsive**: Mobile-friendly interface built with Tailwind CSS
- **⚡ Fast**: Optimized with Vite for lightning-fast development and builds
- **🎨 Beautiful UI**: Modern interface using shadcn/ui components
- **🔄 Real-time**: Efficient data management with MikroORM

## ✨ Features

### 👨‍🎓 Student Management

- Student registration and profile management
- Course enrollment and drop functionality
- Grade viewing and transcript requests
- Parent-student linking system
- Student record search and management
- Academic performance tracking

### 👨‍🏫 Faculty & Staff

- Professor and teaching assistant management
- Course creation and management
- Gradebook and assessment tools
- Office hours scheduling
- Professional development tracking
- Performance evaluations
- Staff directory with research interests

### 📚 Academic Operations

- Course catalog with prerequisites
- Semester management
- Enrollment management with credit limits
- Assessment and grading system
- Transcript generation
- Course difficulty levels and types

### 🎓 Admissions

- Online application system
- Applicant profile management
- Application review workflow
- Decision letter generation
- Program management
- Document upload support

### 🏢 Facilities Management

- Room booking system
- Lab station reservations
- Maintenance ticket system
- Resource allocation
- Facility scheduling

### 💼 HR & Administration

- Payroll management
- Benefits administration
- Leave request system
- Staff performance management
- Professional development tracking

### 📢 Communication

- Messaging system
- Announcements
- Events management
- Parent inquiries
- Office hours coordination

### 📊 Additional Features

- Publication tracking for faculty
- Resource management
- Department organization
- Multi-role support (Student, Professor, Staff, TA, Parent)
- Comprehensive audit trails with timestamps

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software           | Version  | Purpose                       | Installation Link                                                                |
|--------------------|----------|-------------------------------|----------------------------------------------------------------------------------|
| **Docker**         | Latest   | Container runtime             | [Install Docker](https://docs.docker.com/desktop/setup/install/windows-install/) |
| **Docker Compose** | Latest   | Multi-container orchestration | Included with Docker Desktop                                                     |
| **Node.js**        | ≥ 22.0.0 | JavaScript runtime            | [Download Node.js](https://nodejs.org/)                                          |
| **pnpm**           | 10.22.0  | Package manager               | See below                                                                        |

### Installing pnpm

If you don't have `pnpm` installed, install it globally via npm:

```bash
npm install -g pnpm
```

### System Requirements

- **OS**: Windows, macOS, or Linux
- **RAM**: Minimum 4GB (8GB recommended)
- **Disk Space**: At least 2GB free space
- **Ports**: 5000, 5173, and 5433 must be available

## 🚀 Installation

### Option 1: Docker Installation (Recommended)

The easiest way to run the project is using Docker Compose, which automatically sets up all services.

1. **Clone the repository**

   ```bash
   git clone https://github.com/ysif9/orchestrate-ums.git
   cd orchestrate-ums
   ```

2. **Start the application**

   ```bash
   # First time or after Dockerfile/dependency changes
   docker compose up --build

   # Subsequent runs
   docker compose up
   ```

3. **Access the application**

    - **Frontend**: http://localhost:5173
    - **Backend API**: http://localhost:5000
    - **Database**: localhost:5433

4. **Stop the application**

   ```bash
   # Stop containers
   docker compose down

   # Stop and remove volumes (⚠️ deletes all data)
   docker compose down -v
   ```

### Option 2: Local Development Setup

For development without Docker:

1. **Clone the repository**

   ```bash
   git clone https://github.com/ysif9/orchestrate-ums.git
   cd orchestrate-ums
   ```

2. **Set up PostgreSQL**

   Install PostgreSQL 17 and create a database:

   ```sql
   CREATE DATABASE orchestrate;
   CREATE USER postgres WITH PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE orchestrate TO postgres;
   ```

3. **Configure environment variables**

   Create a `.env` file in the `server` directory:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orchestrate
   JWT_SECRET=your_secure_jwt_secret_key_change_this
   JWT_EXPIRE=7d
   PORT=5000
   ```

4. **Install server dependencies**

   ```bash
   cd server
   pnpm install
   ```

5. **Install client dependencies**

   ```bash
   cd ../client
   pnpm install
   ```

6. **Start the development servers**

   In separate terminal windows:

   ```bash
   # Terminal 1 - Start backend
   cd server
   pnpm dev

   # Terminal 2 - Start frontend
   cd client
   pnpm dev
   ```

7. **Access the application**

    - **Frontend**: http://localhost:5173
    - **Backend API**: http://localhost:5000

## ⚙️ Configuration

### Environment Variables

#### Server Configuration

Create a `.env` file in the `server` directory with the following variables:

| Variable       | Description                         | Default                                                    | Required |
|----------------|-------------------------------------|------------------------------------------------------------|----------|
| `DATABASE_URL` | PostgreSQL connection string        | `postgresql://postgres:postgres@postgres:5432/orchestrate` | ✅        |
| `JWT_SECRET`   | Secret key for JWT token generation | `your_jwt_secret_key_change_this_in_production`            | ✅        |
| `JWT_EXPIRE`   | JWT token expiration time           | `7d`                                                       | ✅        |
| `PORT`         | Server port                         | `5000`                                                     | ❌        |
| `DB_NAME`      | Database name                       | `orchestrate`                                              | ❌        |

#### Client Configuration

The client uses environment variables for API endpoints. Create a `.env` file in the `client` directory if needed:

```env
VITE_API_URL=http://localhost:5000
```

### Docker Compose Configuration

The `docker-compose.yml` file defines three services:

- **server**: Express backend (port 5000)
- **client**: React frontend (port 5173)
- **postgres**: PostgreSQL database (port 5433 → 5432)

Volumes:

- `postgres-data`: Persists database data
- `uploads-data`: Stores uploaded files

## 📖 Usage

### Getting Started

1. **Access the application** at http://localhost:5173

2. **Create an account**
    - Click "Sign Up"
    - Choose your role (Student, Professor, Staff, TA, Parent)
    - Fill in required information
    - Password must be at least 8 characters with uppercase, lowercase, and numbers

3. **Login**
    - Use your email and password
    - You'll be redirected to your role-specific dashboard

### User Roles & Capabilities

#### 🎓 Student

- View and enroll in courses
- Check grades and academic records
- Request transcripts
- Book rooms and lab stations
- Submit maintenance tickets
- Access course resources
- View announcements and events

#### 👨‍🏫 Professor

- Create and manage courses
- Grade student assessments
- Set office hours
- Manage teaching assistants
- Upload course resources
- Track publications
- Review applications (if authorized)

#### 👔 Staff

- Manage semesters
- Process transcript requests
- Handle admissions
- Manage facilities and resources
- Process payroll and benefits
- Review leave requests
- Create announcements and events

#### 👨‍💼 Teaching Assistant

- Assist with course management
- Grade assignments
- Hold office hours
- Communicate with students

#### 👨‍👩‍👧 Parent

- Link to student accounts using linking code
- View student grades and progress
- Submit inquiries to staff
- Receive notifications

### Common Workflows

#### Enrolling in a Course (Student)

1. Navigate to Course Catalog
2. Browse or search for courses
3. Check prerequisites and availability
4. Click "Enroll"
5. Confirm enrollment

#### Creating a Course (Professor/Staff)

1. Go to Course Management
2. Click "Create Course"
3. Fill in course details (code, title, credits, etc.)
4. Set prerequisites if any
5. Assign to semester
6. Submit

#### Processing Applications (Staff)

1. Navigate to Applications
2. Filter by status or program
3. Review applicant details
4. Add review comments
5. Make decision (Accept/Reject/Waitlist)
6. Generate decision letter

## 🏗️ Project Structure

```
orchestrate-ums/
├── client/                      # React frontend application
│   ├── public/                  # Static assets
│   ├── src/
│   │   ├── assets/             # Images, fonts, etc.
│   │   ├── components/         # Reusable React components
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CourseDetails.tsx
│   │   │   └── ...
│   │   ├── pages/             # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── StudentHome.tsx
│   │   │   ├── AdminHome.tsx
│   │   │   └── ...
│   │   ├── services/          # API service layer
│   │   │   ├── authService.js
│   │   │   ├── courseService.js
│   │   │   └── ...
│   │   ├── lib/               # Utility functions
│   │   ├── App.tsx            # Main app component
│   │   └── main.tsx           # Entry point
│   ├── Dockerfile             # Client container config
│   ├── package.json
│   ├── vite.config.ts         # Vite configuration
│   └── tailwind.config.js     # Tailwind CSS config
│
├── server/                     # Express backend application
│   ├── entities/              # MikroORM entities (database models)
│   │   ├── User.ts           # Base user entity
│   │   ├── Student.ts        # Student entity
│   │   ├── Professor.ts      # Professor entity
│   │   ├── Staff.ts          # Staff entity
│   │   ├── Course.ts         # Course entity
│   │   ├── Enrollment.ts     # Enrollment entity
│   │   ├── Application.ts    # Application entity
│   │   └── ...               # 50+ entities
│   ├── routes/               # API route handlers
│   │   ├── authRoutes.ts    # Authentication endpoints
│   │   ├── courseRoutes.ts  # Course management
│   │   ├── userRoutes.ts    # User management
│   │   └── ...              # 30+ route files
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts         # JWT authentication
│   │   └── upload.ts       # File upload handling
│   ├── utils/              # Utility functions
│   ├── index.ts            # Server entry point
│   ├── mikro-orm.config.ts # ORM configuration
│   ├── Dockerfile          # Server container config
│   └── package.json
│
├── docker-compose.yml      # Docker orchestration
├── LICENSE                 # GPL v3 license
└── README.md              # This file
```

### Technology Stack

#### Frontend

- **React 19.2.0**: Modern UI library with latest features
- **TypeScript 5.9.3**: Type-safe JavaScript
- **Vite 7.2.2**: Lightning-fast build tool
- **Tailwind CSS 4.1.17**: Utility-first CSS framework
- **React Router 7.9.6**: Client-side routing
- **shadcn/ui**: Beautiful, accessible component library
- **Axios 1.13.2**: HTTP client for API calls
- **Radix UI**: Unstyled, accessible UI primitives
- **Lucide React**: Beautiful icon library

#### Backend

- **Node.js 22**: JavaScript runtime
- **Express 5.1.0**: Web application framework
- **TypeScript 5.9.3**: Type-safe development
- **MikroORM 6.6.1**: TypeScript ORM for PostgreSQL
- **PostgreSQL 17**: Robust relational database
- **JWT (jsonwebtoken 9.0.2)**: Secure authentication
- **bcrypt 6.0.0**: Password hashing
- **Multer 2.0.2**: File upload handling
- **CORS 2.8.5**: Cross-origin resource sharing
- **dotenv 17.2.3**: Environment variable management

#### DevOps & Tools

- **Docker & Docker Compose**: Containerization
- **pnpm 10.22.0**: Fast, disk space efficient package manager
- **ESLint**: Code linting
- **nodemon**: Development auto-reload

## 📡 API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints Overview

#### Authentication (`/api/auth`)

- `POST /signup` - Register new user
- `POST /login` - User login
- `POST /parent-login` - Parent-specific login

#### Users (`/api/users`)

- `GET /` - Get all users (Staff only)
- `GET /:id` - Get user by ID
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user (Staff only)

#### Courses (`/api/courses`)

- `GET /` - List all courses
- `GET /:id` - Get course details
- `POST /` - Create course (Professor/Staff)
- `PUT /:id` - Update course (Professor/Staff)
- `DELETE /:id` - Delete course (Staff)
- `GET /:courseId/tas` - Get teaching assistants for course
- `POST /:courseId/tas` - Assign TA to course

#### Enrollments (`/api/enrollments`)

- `GET /` - Get enrollments (filtered by user role)
- `POST /` - Enroll in course (Student)
- `PUT /:id` - Update enrollment status
- `DELETE /:id` - Drop course (Student)

#### Assessments (`/api/assessments`)

- `GET /course/:courseId` - Get course assessments
- `POST /` - Create assessment (Professor/TA)
- `PUT /:id` - Update assessment
- `DELETE /:id` - Delete assessment
- `POST /:id/grades` - Submit grades

#### Applications (`/api/applications`)

- `GET /` - List applications (Staff/Professor)
- `POST /` - Submit application
- `GET /:id` - Get application details
- `PUT /:id` - Update application

#### Semesters (`/api/semesters`)

- `GET /` - List all semesters
- `GET /active` - Get active semester
- `POST /` - Create semester (Staff)
- `PUT /:id` - Update semester (Staff)

#### Rooms (`/api/rooms`)

- `GET /` - List all rooms
- `POST /` - Create room (Staff)
- `PUT /:id` - Update room (Staff)
- `DELETE /:id` - Delete room (Staff)

#### Bookings (`/api/bookings`)

- `GET /` - Get user's bookings
- `POST /` - Create booking
- `DELETE /:id` - Cancel booking

#### Lab Stations (`/api/lab-stations`)

- `GET /` - List lab stations
- `POST /` - Create lab station (Staff)
- `PUT /:id` - Update lab station (Staff)

#### Lab Reservations (`/api/lab-reservations`)

- `GET /` - Get reservations
- `POST /` - Create reservation
- `DELETE /:id` - Cancel reservation

#### Maintenance Tickets (`/api/tickets`)

- `GET /` - Get user's tickets
- `POST /` - Create ticket
- `PUT /:id` - Update ticket status

#### Transcripts (`/api/transcript-requests`)

- `GET /` - Get transcript requests
- `POST /` - Request transcript (Student)
- `PUT /:id` - Update request status (Staff)

#### Messages (`/api/messages`)

- `GET /` - Get user's messages
- `POST /` - Send message
- `PUT /:id/read` - Mark as read

#### Announcements (`/api/announcements`)

- `GET /` - Get announcements
- `POST /` - Create announcement (Staff)
- `PUT /:id` - Update announcement (Staff)
- `DELETE /:id` - Delete announcement (Staff)

#### Events (`/api/events`)

- `GET /` - Get events
- `POST /` - Create event (Staff)
- `PUT /:id` - Update event (Staff)
- `DELETE /:id` - Delete event (Staff)

## 🧪 Testing

### Running Tests

Currently, the project uses manual testing. Automated testing setup is planned for future releases.

### Manual Testing Checklist

#### Authentication

- [x] User registration with all roles
- [x] User login
- [x] JWT token generation
- [x] Password validation
- [x] Parent login with linking code

#### Student Features

- [x] Course enrollment
- [x] View grades
- [x] Request transcripts
- [x] Book rooms
- [x] Reserve lab stations
- [x] Submit maintenance tickets

#### Professor Features

- [x] Create courses
- [x] Manage enrollments
- [x] Create assessments
- [x] Grade students
- [x] Set office hours
- [x] Assign TAs

#### Staff Features

- [x] Manage semesters
- [x] Process applications
- [x] Manage facilities
- [x] Process transcript requests
- [x] Create announcements
- [x] Manage events

### Test Data

The application includes seed data for:

- Engineering programs (Computer Science, Electrical, Mechanical, etc.)
- Sample semesters
- Test users (create via signup)

## 🤝 Contributing

We welcome contributions from the community! Whether it's bug fixes, new features, documentation improvements, or
suggestions, your help is appreciated.

### How to Contribute

1. **Fork the repository**

   Click the "Fork" button at the top right of the repository page.

2. **Clone your fork**

   ```bash
   git clone https://github.com/your-username/orchestrate-ums.git
   cd orchestrate-ums
   ```

3. **Create a feature branch**

   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**

    - Write clean, maintainable code
    - Follow the existing code style
    - Add comments where necessary
    - Update documentation if needed

5. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

   **Commit Message Convention:**
    - `feat:` - New feature
    - `fix:` - Bug fix
    - `docs:` - Documentation changes
    - `style:` - Code style changes (formatting, etc.)
    - `refactor:` - Code refactoring
    - `test:` - Adding or updating tests
    - `chore:` - Maintenance tasks

6. **Push to your fork**

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Create a Pull Request**

    - Go to the original repository
    - Click "New Pull Request"
    - Select your fork and branch
    - Provide a clear description of your changes
    - Link any related issues

### Contribution Guidelines

- **Code Quality**: Ensure your code is clean, well-documented, and follows TypeScript best practices
- **Testing**: Test your changes thoroughly before submitting
- **Documentation**: Update README and other docs if your changes affect them
- **Commits**: Use meaningful commit messages following the convention above
- **Pull Requests**: Keep PRs focused on a single feature or fix
- **Issues**: Check existing issues before creating new ones

### Areas for Contribution

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- ♿ Accessibility improvements
- 🌐 Internationalization (i18n)
- 🧪 Test coverage
- ⚡ Performance optimizations
- 🔒 Security enhancements

### Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## 📄 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

### Development Team

* Yousif Abdulhafiz - [@ysif9](https://github.com/ysif9)
* Hams Hassan - [@Hams2305](https://github.com/Hams2305)
* Jana Sameh - [@janasameh7](https://github.com/janasameh7)
* Ahmed Lotfy - [@alotfy25](https://github.com/alofty25)
* Adham Kandil - [@Kandil122](https://github.com/Kandil122)

### Contributors

We appreciate all contributors who have helped make this project better!

See the list of [contributors](https://github.com/ysif9/orchestrate-ums/contributors) who participated in this project.

### Acknowledgments

- Built with ❤️ by the Orchestrate team
- Inspired by the need for modern, efficient university management systems
- Thanks to all open-source projects that made this possible
- Special thanks to the TypeScript, React, and Express communities

## 📞 Support

### Getting Help

If you need help or have questions:

1. **📖 Documentation**: Check this README and inline code documentation
2. **🐛 Issues**: Search [existing issues](https://github.com/ysif9/orchestrate-ums/issues) or create a new one
3. **💬 Discussions**: Join [GitHub Discussions](https://github.com/ysif9/orchestrate-ums/discussions) for questions and
   ideas
4. **📧 Email**: Contact the maintainers (see repository for contact info)

### Reporting Bugs

When reporting bugs, please include:

- **Description**: Clear description of the issue
- **Steps to Reproduce**: Detailed steps to reproduce the behavior
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Screenshots**: If applicable
- **Environment**:
    - OS (Windows/Mac/Linux)
    - Node.js version
    - Docker version (if using Docker)
    - Browser (if frontend issue)

### Feature Requests

We welcome feature requests! Please:

- Check if the feature has already been requested
- Provide a clear use case
- Explain why this feature would be useful
- Consider contributing the feature yourself

### Security Issues

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead:

1. Email the maintainers directly
2. Provide detailed information about the vulnerability
3. Allow time for the issue to be addressed before public disclosure

## 🗺️ Roadmap

### Current Version: 1.0.0

### Planned Features

#### Version 1.1.0

- [ ] Automated testing suite (Jest, React Testing Library)
- [ ] Email notifications system
- [ ] Advanced search and filtering
- [ ] Export data to CSV/PDF
- [ ] Mobile app (React Native)

#### Version 1.2.0

- [ ] Real-time chat system
- [ ] Video conferencing integration
- [ ] Calendar integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (i18n)

#### Version 2.0.0

- [ ] Microservices architecture
- [ ] GraphQL API
- [ ] Advanced reporting system
- [ ] AI-powered recommendations
- [ ] Integration with external systems (LMS, payment gateways)

### Long-term Goals

- Cloud-native deployment
- Mobile-first responsive design
- Accessibility compliance (WCAG 2.1)
- Performance optimization
- Comprehensive API documentation (Swagger/OpenAPI)

## 📊 Project Status

- **Status**: Active Development
- **Version**: 1.0.0
- **Last Updated**: December 2025
- **Maintained**: Yes ✅

## 🙏 Acknowledgments

### Technologies Used

This project wouldn't be possible without these amazing open-source projects:

- [React](https://reactjs.org/) - UI library
- [Express](https://expressjs.com/) - Web framework
- [PostgreSQL](https://www.postgresql.org/) - Database
- [MikroORM](https://mikro-orm.io/) - TypeScript ORM
- [Vite](https://vitejs.dev/) - Build tool
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Component library
- [Docker](https://www.docker.com/) - Containerization
- [TypeScript](https://www.typescriptlang.org/) - Type safety

### Inspiration

- Modern university management needs
- Agile development principles
- User-centered design
- Open-source community

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ by the Orchestrate Team**

[Report Bug](https://github.com/ysif9/orchestrate-ums/issues) · [Request Feature](https://github.com/ysif9/orchestrate-ums/issues) · [Contribute](https://github.com/ysif9/orchestrate-ums/pulls)

**© 2025 Orchestrate Team. Licensed under GPL v3.**

</div>
