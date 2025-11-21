// File: src/pages/AssessmentCreationPage.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Ensure your styles for AssessmentCreationPage.css exist or use existing common styles

const API_BASE_URL = 'http://localhost:5000/api';

function AssessmentCreationPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        course: '',
        title: '',
        description: '',
        type: 'assignment',
        totalMarks: 10,
        dueDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Fetch Courses 
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                // Uses the route we debugged: GET /api/assessments/courses/my-teaching-courses
                const response = await axios.get(`${API_BASE_URL}/assessments/courses/my-teaching-courses`); 
                setCourses(response.data.courses || []);
            } catch (err) {
                setError('Failed to load courses. Check backend connectivity.');
            }
        };
        fetchCourses();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'totalMarks' ? parseInt(value) || 0 : value 
        }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!formData.course || !formData.title || !formData.totalMarks) {
            setError('Please fill in all required fields (Course, Title, Total Marks).');
            setLoading(false);
            return;
        }

        try {
            // POST to your EXISTING assessment creation route: POST /api/assessments/
            const response = await axios.post(`${API_BASE_URL}/assessments`, formData); 

            setMessage(response.data.message);
            // Optionally redirect after a brief success message
            setTimeout(() => {
                navigate('/admin/courses'); 
            }, 1500);

        } catch (err) {
            const msg = err.response?.data?.message || 'Assessment creation failed.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container assessment-creation-container">
            <h1>Create New Assessment</h1>
            <button onClick={() => navigate('/home')} className="back-btn">
                ← Back to Home
            </button>
            
            {error && <div className="error-box">{error}</div>}
            {message && <div className="success-box">{message}</div>}

            <form onSubmit={handleSubmit} className="assessment-form">
                
                {/* 1. Course Selector */}
                <div className="form-group">
                    <label htmlFor="course">Select Course:</label>
                    <select
                        id="course"
                        name="course"
                        value={formData.course}
                        onChange={handleChange}
                        disabled={courses.length === 0 || loading}
                        required
                    >
                        <option value="">-- Choose a Course --</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.code} - {course.title}
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Assessment Title */}
                <div className="form-group">
                    <label htmlFor="title">Assessment Title:</label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Final Exam, Homework 5"
                        disabled={loading}
                        required
                    />
                </div>

                {/* 3. Assessment Type */}
                <div className="form-group">
                    <label htmlFor="type">Type:</label>
                    <select
                        id="type"
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        disabled={loading}
                    >
                        {['assignment', 'quiz', 'midterm', 'final', 'project'].map(t => (
                            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                        ))}
                    </select>
                </div>

                {/* 4. Total Marks */}
                <div className="form-group">
                    <label htmlFor="totalMarks">Total Marks:</label>
                    <input
                        type="number"
                        id="totalMarks"
                        name="totalMarks"
                        value={formData.totalMarks}
                        onChange={handleChange}
                        min="1"
                        disabled={loading}
                        required
                    />
                </div>

                {/* 5. Due Date */}
                <div className="form-group">
                    <label htmlFor="dueDate">Due Date:</label>
                    <input
                        type="date"
                        id="dueDate"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                {/* 6. Description */}
                <div className="form-group">
                    <label htmlFor="description">Description (Optional):</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        disabled={loading}
                    />
                </div>

                <button type="submit" disabled={loading} className="submit-btn">
                    {loading ? 'Creating...' : 'Create Assessment'}
                </button>
            </form>
        </div>
    );
}

export default AssessmentCreationPage;