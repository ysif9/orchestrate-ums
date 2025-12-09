import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Lock } from 'lucide-react';

const Dashboard = () => {
    const [courses, setCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [completedCourseIds, setCompletedCourseIds] = useState([]);

    // Filters State
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [difficultyFilter, setDifficultyFilter] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const coursesRes = await axios.get('http://localhost:5000/api/courses');
                setCourses(coursesRes.data);
                setFilteredCourses(coursesRes.data);

                // Get enrollments for the current authenticated user
                // The API automatically filters by the authenticated user's ID
                const enrollRes = await axios.get('http://localhost:5000/api/enrollments');
                const completed = enrollRes.data
                    .filter(enr => enr.status === 'completed')
                    .map(enr => enr.course.id || enr.course);
                setCompletedCourseIds(completed);
            } catch (error) {
                console.error("Error loading data:", error);
            }
        };
        fetchData();
    }, []);

    // Handle Filter Logic
    useEffect(() => {
        let result = courses;
        if (subjectFilter !== 'All') {
            result = result.filter(c => c.subjectArea === subjectFilter);
        }
        if (difficultyFilter !== 'All') {
            result = result.filter(c => c.difficulty === difficultyFilter);
        }
        setFilteredCourses(result);
    }, [subjectFilter, difficultyFilter, courses]);

    const isLocked = (course) => {
        if (!course.prerequisites || course.prerequisites.length === 0) return false;
        return !course.prerequisites.every(prereqId => completedCourseIds.includes(prereqId));
    };

    // Extract unique subjects for dropdown
    const subjects = ['All', ...new Set(courses.map(c => c.subjectArea))];

    return (
        <>
            {/* AIN SHAMS HEADER */}
            <nav className="bg-brand-500 text-content-inverse px-8 py-6 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold m-0 text-content-inverse">
                        AIN SHAMS
                        <span className="block text-xs font-normal tracking-wider text-brand-100 mt-1">UNIVERSITY | FACULTY OF ENGINEERING</span>
                    </h1>
                    <div className="flex gap-6">
                        <Link to="/" className="text-content-inverse hover:text-accent-300 transition-colors no-underline">Home</Link>
                        <Link to="/" className="text-content-inverse hover:text-accent-300 transition-colors no-underline">Departments</Link>
                        <Link to="/" className="text-content-inverse hover:text-accent-300 transition-colors no-underline">Portal Login</Link>
                    </div>
                </div>
            </nav>

            {/* Filter Bar */}
            <div className="bg-surface border-b border-border px-8 py-4">
                <div className="max-w-7xl mx-auto flex gap-4">
                    <select
                        className="px-4 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                        {subjects.map(s => <option key={s} value={s}>Department: {s}</option>)}
                    </select>

                    <select
                        className="px-4 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                    >
                        <option value="All">Level: All</option>
                        <option value="Introductory">Year 1-2 (Intro)</option>
                        <option value="Intermediate">Year 3 (Intermediate)</option>
                        <option value="Advanced">Year 4 (Advanced)</option>
                    </select>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="text-content-secondary mb-6 text-sm">{filteredCourses.length} Courses Available</div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => {
                        const locked = isLocked(course);

                        return (
                            <Link
                                to={locked ? '#' : `/course/${course.id}`}
                                key={course.id}
                                className={`no-underline ${locked ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className={`bg-surface rounded-lg shadow-card hover:shadow-card-hover transition-all overflow-hidden ${locked ? 'opacity-60' : ''}`}>
                                    <img src={course.image} alt={course.title} className="w-full h-48 object-cover" />

                                    <div className="p-6">
                                        <div className="bg-brand-50 text-brand-600 px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 mb-3">
                                            {locked && <Lock size={14} />}
                                            {course.subjectArea}
                                        </div>
                                        <h3 className="text-lg font-bold text-content mb-2 m-0">{course.title}</h3>
                                        <p className="text-content-secondary text-sm mb-4 line-clamp-2">{course.description}</p>

                                        <div className="flex justify-between text-xs text-content-tertiary">
                                            <span>{course.difficulty}</span>
                                            <span>{course.credits} CH</span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default Dashboard;