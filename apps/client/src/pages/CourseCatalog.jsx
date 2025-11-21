import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { authService } from '../services/authService';
import { Lock } from 'lucide-react';
import '../styles/CourseCatalog.css';

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
            <div className="catalog-loading">
                <div className="loading-spinner"></div>
                <p>Loading courses...</p>
            </div>
        );
    }

    return (
        <div className="catalog-container">
            {/* Header */}
            <header className="catalog-header">
                <div className="header-content">
                    <h1>Course Catalog</h1>
                    <p className="header-subtitle">Browse and filter available courses</p>
                </div>
                <div className="header-actions">
                    <span className="user-info">Welcome, {user?.name}</span>
                    <button
                        onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}
                        className="btn-secondary"
                    >
                        Home
                    </button>
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            {/* Filter Section */}
            <div className="filter-section">
                <div className="filter-header">
                    <h2>Filter Courses</h2>
                    <button onClick={resetFilters} className="btn-reset">
                        Reset Filters
                    </button>
                </div>

                <div className="filters-grid">
                    {/* Search */}
                    <div className="filter-group">
                        <label htmlFor="search">Search</label>
                        <input
                            id="search"
                            type="text"
                            placeholder="Search by title, code, or description..."
                            value={filters.searchTerm}
                            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                            className="filter-input"
                        />
                    </div>

                    {/* Level Filter */}
                    <div className="filter-group">
                        <label htmlFor="level">Level</label>
                        <select
                            id="level"
                            value={filters.level}
                            onChange={(e) => handleFilterChange('level', e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">All Levels</option>
                            <option value="Introductory">Introductory</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                    </div>

                    {/* Credits Filter */}
                    <div className="filter-group">
                        <label htmlFor="credits">Credit Hours</label>
                        <select
                            id="credits"
                            value={filters.credits}
                            onChange={(e) => handleFilterChange('credits', e.target.value)}
                            className="filter-select"
                        >
                            {uniqueCredits.map(credit => (
                                <option key={credit} value={credit}>
                                    {credit === 'All' ? 'All Credits' : `${credit} Credits`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Type Filter */}
                    <div className="filter-group">
                        <label htmlFor="type">Course Type</label>
                        <select
                            id="type"
                            value={filters.type}
                            onChange={(e) => handleFilterChange('type', e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">All Types</option>
                            <option value="Core">Core</option>
                            <option value="Elective">Elective</option>
                        </select>
                    </div>

                    {/* Prerequisites Filter */}
                    <div className="filter-group">
                        <label htmlFor="prerequisites">Prerequisites</label>
                        <select
                            id="prerequisites"
                            value={filters.hasPrerequisites}
                            onChange={(e) => handleFilterChange('hasPrerequisites', e.target.value)}
                            className="filter-select"
                        >
                            <option value="All">All Courses</option>
                            <option value="false">No Prerequisites</option>
                            <option value="true">Has Prerequisites</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            <div className="results-section">
                <div className="results-header">
                    <h3>{filteredCourses.length} Course{filteredCourses.length !== 1 ? 's' : ''} Found</h3>
                </div>

                {filteredCourses.length === 0 ? (
                    <div className="no-results">
                        <p>No courses match your current filters.</p>
                        <button onClick={resetFilters} className="btn-primary">
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="courses-grid">
                        {filteredCourses.map(course => {
                            const locked = isLocked(course);
                            const hasPrereqs = course.prerequisites && course.prerequisites.length > 0;

                            return (
                                <div key={course._id} className={`course-card ${locked ? 'locked' : ''}`}>
                                    <div className="course-card-header">
                                        <div className="course-code">{course.code}</div>
                                        <div className="course-badges">
                                            <span className={`badge badge-${course.type.toLowerCase()}`}>
                                                {course.type}
                                            </span>
                                            {locked && <span className="badge badge-locked"><Lock size={14} style={{marginRight:'4px', display:'inline', verticalAlign:'middle'}} /> Locked</span>}
                                        </div>
                                    </div>

                                    <h3 className="course-title">{course.title}</h3>
                                    <p className="course-description">{course.description}</p>

                                    <div className="course-details">
                                        <div className="detail-item">
                                            <span className="detail-label">Level:</span>
                                            <span className="detail-value">{course.difficulty}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Credits:</span>
                                            <span className="detail-value">{course.credits} CH</span>
                                        </div>
                                        {hasPrereqs && (
                                            <div className="detail-item full-width">
                                                <span className="detail-label">Prerequisites:</span>
                                                <span className="detail-value">
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

                                    <div className="course-card-footer">
                                        <Link to={`/catalog/course/${course._id}`} className="btn-view">
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
    );
}

export default CourseCatalog;

