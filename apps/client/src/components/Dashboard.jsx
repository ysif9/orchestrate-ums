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
                    .map(enr => enr.course._id || enr.course);
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
            <nav className="navbar">
                <h1>
                    AIN SHAMS
                    <span className="uni-subtext">UNIVERSITY | FACULTY OF ENGINEERING</span>
                </h1>
                <div className="nav-links">
                    <Link to="/">Home</Link>
                    <Link to="/">Departments</Link>
                    <Link to="/">Portal Login</Link>
                </div>
            </nav>

            {/* Filter Bar */}
            <div className="filter-bar">
                <select className="filter-select" onChange={(e) => setSubjectFilter(e.target.value)}>
                    {subjects.map(s => <option key={s} value={s}>Department: {s}</option>)}
                </select>
                
                <select className="filter-select" onChange={(e) => setDifficultyFilter(e.target.value)}>
                    <option value="All">Level: All</option>
                    <option value="Introductory">Year 1-2 (Intro)</option>
                    <option value="Intermediate">Year 3 (Intermediate)</option>
                    <option value="Advanced">Year 4 (Advanced)</option>
                </select>
            </div>

            <div className="dashboard-container">
                <div className="results-count">{filteredCourses.length} Courses Available</div>

                <div className="course-grid">
                    {filteredCourses.map(course => {
                        const locked = isLocked(course);
                        
                        return (
                            <Link to={locked ? '#' : `/course/${course._id}`} key={course._id} style={{cursor: locked ? 'default' : 'pointer'}}>
                                <div className={`course-card ${locked ? 'locked' : ''}`}>
                                    <img src={course.image} alt={course.title} className="card-image" />
                                    
                                    <div className="card-body">
                                        <div className="subject-tag">
                                            {locked && <Lock size={14} style={{marginRight:'5px', display:'inline'}} />}
                                            {course.subjectArea}
                                        </div>
                                        <h3 className="card-title">{course.title}</h3>
                                        <p className="card-desc">{course.description}</p>
                                        
                                        <div className="card-footer">
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