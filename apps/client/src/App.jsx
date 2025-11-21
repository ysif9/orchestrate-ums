import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentHome from './pages/StudentHome';
import AdminCourseManager from './pages/AdminCourseManager';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import CourseDetails from './components/CourseDetails';
import './App.css';
import GradebookPage from './pages/GradebookPage'; // Already imported
import AssessmentCreationPage from './pages/AssessmentCreationPage';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
function ProtectedRoute({ children }) {
    const isAuthenticated = authService.isAuthenticated();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

/**
 * Root Redirect Component
 * Redirects to home if authenticated, otherwise to login
 */
function RootRedirect() {
    const isAuthenticated = authService.isAuthenticated();
    return <Navigate to={isAuthenticated ? "/home" : "/login"} replace />;
}

/**
 * Main App Component with Routing
 */
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected Routes */}
                <Route
                    path="/home"
                    element={
                        <ProtectedRoute>
                            <StudentHome />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/courses"
                    element={
                        <ProtectedRoute>
                            <StudentHome />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/admin/courses"
                    element={
                        <ProtectedRoute>
                            <AdminCourseManager />
                        </ProtectedRoute>
                    }
                />
                {/* 🌟 NEW ROUTE ADDED HERE: Assessment Creation 🌟 */}
                <Route
                    path="/admin/assessments/create"
                    element={
                        <ProtectedRoute>
                            <AssessmentCreationPage />
                        </ProtectedRoute>
                    }
                />


                {/* === NEW ROUTE ADDED HERE === */}
                <Route
                    path="/admin/gradebook"
                    element={
                        <ProtectedRoute>
                            <GradebookPage />
                        </ProtectedRoute>
                    }
                />
                {/* ============================= */}

                {/* Smart redirect based on authentication status */}
                <Route path="/" element={<RootRedirect />} />

                {/* Catch all - smart redirect */}
                <Route path="*" element={<RootRedirect />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/course/:id" element={<CourseDetails />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;