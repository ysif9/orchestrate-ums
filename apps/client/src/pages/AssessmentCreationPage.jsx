// src/pages/AssessmentCreationPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../styles/AssessmentCreationPage.css';

const API_BASE_URL = 'http://localhost:5000/api';

function AssessmentCreationPage() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const isAdminOrStaff = user?.role === 'admin' || user?.role === 'staff';

  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course: '',
    title: '',
    description: '',
    type: 'assignment',
    totalMarks: 100,
    dueDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/assessments/courses/my-teaching-courses`);
        setCourses(response.data.courses || []);
      } catch (err) {
        setError('Failed to load your courses. Please ensure you have created courses.');
      }
    };
    fetchCourses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'totalMarks' ? parseInt(value) || null : value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (!formData.course || !formData.title || !formData.totalMarks) {
      setError('Course, Title, and Total Marks are required.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/assessments`, formData);
      setMessage('Assessment created successfully! Redirecting...');
      setTimeout(() => navigate('/admin/courses'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="assessment-creation-page">
      <div className="assessment-container">
        <div className="assessment-header">
          <button
            onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}
            className="back-home-btn"
          >
            Back to Home
          </button>
          <h1>Create New Assessment</h1>
          <p>Add quizzes, assignments, midterms, or final exams</p>
        </div>

        <div className="assessment-form-wrapper">
          {error && <div className="message error-message">{error}</div>}
          {message && <div className="message success-message">{message}</div>}

          <form onSubmit={handleSubmit} className="assessment-form">
            <div className="form-group">
              <label>Select Course <span className="required">*</span></label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                disabled={courses.length === 0}
              >
                <option value="">-- Choose a Course --</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && <small>No courses found. Create a course first.</small>}
            </div>

            <div className="form-group">
              <label>Assessment Title <span className="required">*</span></label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Final Exam, Midterm Quiz, Project Phase 2"
                required
              />
            </div>

            <div className="form-group">
              <label>Type</label>
              <select name="type" value={formData.type} onChange={handleChange}>
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm Exam</option>
                <option value="final">Final Exam</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Marks <span className="required">*</span></label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleChange}
                min="1"
                max="500"
                required
              />
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Description / Instructions (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details, rubric, or submission instructions..."
                rows="4"
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating Assessment...' : 'Create Assessment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssessmentCreationPage;