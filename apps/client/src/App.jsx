import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentHome from './pages/StudentHome';
import AdminCourseManager from './pages/AdminCourseManager';
import CourseCatalog from './pages/CourseCatalog';
import CatalogCourseDetails from './pages/CatalogCourseDetails';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import CourseDetails from './components/CourseDetails';
import './App.css';

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
                            <CourseCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/catalog"
                    element={
                        <ProtectedRoute>
                            <CourseCatalog />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/catalog/course/:id"
                    element={
                        <ProtectedRoute>
                            <CatalogCourseDetails />
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
                <Route
                    path="/course/:id"
                    element={
                        <ProtectedRoute>
                            <CourseDetails />
                        </ProtectedRoute>
                    }
                />

                {/* Dashboard (legacy) */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Smart redirect based on authentication status */}
                <Route path="/" element={<RootRedirect />} />

                {/* Catch all - smart redirect */}
                <Route path="*" element={<RootRedirect />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;