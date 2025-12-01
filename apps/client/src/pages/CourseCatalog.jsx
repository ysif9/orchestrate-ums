import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import { Lock } from 'lucide-react';

/**
 * Course Catalog Page
 * Allows students to view and filter courses based on multiple criteria
 */
function CourseCatalog() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [completedCourseIds, setCompletedCourseIds] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [filters, setFilters] = useState({
        level: 'All',
        credits: 'All',
        type: 'All',
        hasPrerequisites: 'All',
        searchTerm: ''
    });

    // Fetch courses and enrollments
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Fetch all courses
                const coursesRes = await axios.get('http://localhost:5000/api/courses');
                setCourses(coursesRes.data);

                // Fetch user's enrollments to determine completed courses
                const enrollRes = await axios.get('http://localhost:5000/api/enrollments');
                const completed = enrollRes.data
                    .filter(enr => enr.status === 'completed')
                    .map(enr => enr.course._id);
                setCompletedCourseIds(completed);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Apply filters whenever courses or filter values change
    useEffect(() => {
        let result = courses;

        // Filter by level (difficulty)
        if (filters.level !== 'All') {
            result = result.filter(c => c.difficulty === filters.level);
        }

        // Filter by credits
        if (filters.credits !== 'All') {
            result = result.filter(c => c.credits === parseInt(filters.credits));
        }

        // Filter by type
        if (filters.type !== 'All') {
            result = result.filter(c => c.type === filters.type);
        }

        // Filter by prerequisite status
        if (filters.hasPrerequisites === 'true') {
            result = result.filter(c => c.prerequisites && c.prerequisites.length > 0);
        } else if (filters.hasPrerequisites === 'false') {
            result = result.filter(c => !c.prerequisites || c.prerequisites.length === 0);
        }

        // Filter by search term
        if (filters.searchTerm) {
            const search = filters.searchTerm.toLowerCase();
            result = result.filter(c =>
                c.title.toLowerCase().includes(search) ||
                c.code.toLowerCase().includes(search) ||
                c.description?.toLowerCase().includes(search)
            );
        }

        setFilteredCourses(result);
    }, [filters, courses]);

    // Check if a course is locked due to unmet prerequisites
    const isLocked = (course) => {
        if (!course.prerequisites || course.prerequisites.length === 0) return false;
        return !course.prerequisites.every(prereq =>
            completedCourseIds.includes(prereq._id || prereq)
        );
    };

    // Handle filter changes
    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setFilters({
            level: 'All',
            credits: 'All',
            type: 'All',
            hasPrerequisites: 'All',
            searchTerm: ''
        });
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    // Extract unique credit values for filter dropdown
    const uniqueCredits = ['All', ...new Set(courses.map(c => c.credits))].sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;
        return a - b;
    });

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center">
                <div className="loading-spinner"></div>
                <p className="mt-4 text-content-secondary">Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="bg-brand-500 text-content-inverse px-8 py-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold m-0 text-content-inverse">Course Catalog</h1>
                        <p className="text-brand-100 mt-1">Browse and filter available courses</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-brand-100 text-sm">Welcome, {user?.name}</span>
                        <button
                            onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}
                            className="bg-transparent border border-brand-200 hover:bg-brand-400 hover:border-brand-100 text-content-inverse px-4 py-2 rounded text-sm transition-all font-medium"
                        >
                            Home
                        </button>
                        <button
                            onClick={handleLogout}
                            className="bg-error-600 hover:bg-error-700 text-content-inverse px-4 py-2 rounded text-sm transition-all font-medium"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Filter Section */}
                <div className="bg-surface rounded-lg shadow-card p-6 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-content m-0">Filter Courses</h2>
                        <button
                            onClick={resetFilters}
                            className="bg-surface-tertiary hover:bg-surface-hover text-content px-4 py-2 rounded text-sm transition-colors font-medium"
                        >
                            Reset Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="flex flex-col">
                            <label htmlFor="search" className="text-sm font-medium mb-2 text-content">Search</label>
                            <input
                                id="search"
                                type="text"
                                placeholder="Search by title, code, or description..."
                                value={filters.searchTerm}
                                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface text-content"
                            />
                        </div>

                        {/* Level Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="level" className="text-sm font-medium mb-2 text-content">Level</label>
                            <select
                                id="level"
                                value={filters.level}
                                onChange={(e) => handleFilterChange('level', e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface text-content"
                            >
                                <option value="All">All Levels</option>
                                <option value="Introductory">Introductory</option>
                                <option value="Intermediate">Intermediate</option>
                                <option value="Advanced">Advanced</option>
                            </select>
                        </div>

                        {/* Credits Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="credits" className="text-sm font-medium mb-2 text-content">Credit Hours</label>
                            <select
                                id="credits"
                                value={filters.credits}
                                onChange={(e) => handleFilterChange('credits', e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface text-content"
                            >
                                {uniqueCredits.map(credit => (
                                    <option key={credit} value={credit}>
                                        {credit === 'All' ? 'All Credits' : `${credit} Credits`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="type" className="text-sm font-medium mb-2 text-content">Course Type</label>
                            <select
                                id="type"
                                value={filters.type}
                                onChange={(e) => handleFilterChange('type', e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface text-content"
                            >
                                <option value="All">All Types</option>
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                            </select>
                        </div>

                        {/* Prerequisites Filter */}
                        <div className="flex flex-col">
                            <label htmlFor="prerequisites" className="text-sm font-medium mb-2 text-content">Prerequisites</label>
                            <select
                                id="prerequisites"
                                value={filters.hasPrerequisites}
                                onChange={(e) => handleFilterChange('hasPrerequisites', e.target.value)}
                                className="px-3 py-2 border border-border rounded-md text-sm transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 bg-surface text-content"
                            >
                                <option value="All">All Courses</option>
                                <option value="false">No Prerequisites</option>
                                <option value="true">Has Prerequisites</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                <div>
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-content">{filteredCourses.length} Course{filteredCourses.length !== 1 ? 's' : ''} Found</h3>
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-content-secondary mb-4">No courses match your current filters.</p>
                            <button
                                onClick={resetFilters}
                                className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg transition-all font-medium shadow-button hover:shadow-button-hover"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map(course => {
                                const locked = isLocked(course);
                                const hasPrereqs = course.prerequisites && course.prerequisites.length > 0;

                                return (
                                    <div
                                        key={course._id}
                                        className={`bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-all p-6 flex flex-col ${locked ? 'opacity-75' : ''}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="text-brand-500 font-bold text-lg">{course.code}</div>
                                            <div className="flex gap-2 flex-wrap justify-end">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.type === 'Core'
                                                        ? 'bg-course-core-bg text-course-core'
                                                        : 'bg-course-elective-bg text-course-elective'
                                                    }`}>
                                                    {course.type}
                                                </span>
                                                {locked && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-surface-tertiary text-content-secondary flex items-center gap-1">
                                                        <Lock size={14} /> Locked
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-semibold text-content mb-2">{course.title}</h3>
                                        <p className="text-sm text-content-secondary mb-4 flex-grow line-clamp-3">{course.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-content-tertiary">Level:</span>
                                                <span className="font-medium text-content">{course.difficulty}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-content-tertiary">Credits:</span>
                                                <span className="font-medium text-content">{course.credits} CH</span>
                                            </div>
                                            {hasPrereqs && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-content-tertiary">Prerequisites:</span>
                                                    <span className="font-medium text-content">
                                                        {course.prerequisites.map((prereq, idx) => (
                                                            <span key={prereq._id || prereq}>
                                                                {prereq.code || prereq}
                                                                {idx < course.prerequisites.length - 1 ? ', ' : ''}
                                                            </span>
                                                        ))}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto">
                                            <Link
                                                to={`/catalog/course/${course._id}`}
                                                className="block w-full text-center bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2 rounded-lg transition-all no-underline font-medium shadow-button hover:shadow-button-hover"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseCatalog;

