// src/pages/AssessmentCreationPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

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
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => navigate(isAdminOrStaff ? '/admin/home' : '/home')}
            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 mb-4 shadow-button hover:shadow-button-hover"
          >
            Back to Home
          </button>
          <h1 className="text-3xl font-bold text-content m-0">Create New Assessment</h1>
          <p className="text-content-secondary mt-2">Add quizzes, assignments, midterms, or final exams</p>
        </div>

        <div className="bg-surface rounded-lg shadow-card p-8">
          {error && <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm border border-error-200">{error}</div>}
          {message && <div className="bg-success-100 text-success-700 px-4 py-3 rounded-lg mb-4 text-sm border border-success-200">{message}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">
                Select Course <span className="text-error-600">*</span>
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                required
                disabled={courses.length === 0}
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-surface-tertiary disabled:cursor-not-allowed"
              >
                <option value="">-- Choose a Course --</option>
                {courses.map(course => (
                  <option key={course._id} value={course._id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
              {courses.length === 0 && <small className="text-content-tertiary text-xs mt-1">No courses found. Create a course first.</small>}
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">
                Assessment Title <span className="text-error-600">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Final Exam, Midterm Quiz, Project Phase 2"
                required
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              >
                <option value="assignment">Assignment</option>
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm Exam</option>
                <option value="final">Final Exam</option>
                <option value="project">Project</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">
                Total Marks <span className="text-error-600">*</span>
              </label>
              <input
                type="number"
                name="totalMarks"
                value={formData.totalMarks}
                onChange={handleChange}
                min="1"
                max="500"
                required
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">Due Date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-2 text-content">Description / Instructions (Optional)</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide details, rubric, or submission instructions..."
                rows="4"
                className="px-3 py-2 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-y"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 text-content-inverse px-6 py-3 rounded-lg font-semibold transition-all shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Assessment...' : 'Create Assessment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AssessmentCreationPage;