import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const CourseDetails = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);

    useEffect(() => {
        axios.get(`http://localhost:5000/api/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err));
    }, [id]);

    if (!course) return <div>Loading...</div>;

    return (
        <div className="course-details-container">
            <Link to="/" className="back-btn">&larr; Back to Dashboard</Link>
            
            <div className="header-section">
                <h1>{course.title} <span className="code">({course.code})</span></h1>
                <p className="description">{course.description}</p>
            </div>

            <div className="info-grid">
                <div className="info-card">
                    <h3>Professor</h3>
                    <p>{course.professor}</p>
                </div>
                <div className="info-card">
                    <h3>Course Marks</h3>
                    <p>Total: {course.totalMarks}</p>
                    <p>Passing: {course.passingMarks}</p>
                </div>
                <div className="info-card">
                    <h3>Credits</h3>
                    <p>{course.credits}</p>
                </div>
            </div>

            <div className="lessons-section">
                <h2>Course Lessons</h2>
                {course.lessons && course.lessons.length > 0 ? (
                    <ul className="lesson-list">
                        {course.lessons.map((lesson, index) => (
                            <li key={index} className="lesson-item">
                                <div className="lesson-number">{index + 1}</div>
                                <div className="lesson-content">
                                    <h4>{lesson.title || `Lesson ${index + 1}`}</h4>
                                    <p>{lesson.duration || 'Duration TBA'}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No lessons uploaded yet.</p>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;