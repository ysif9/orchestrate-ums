// src/pages/MyGradesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

function MyGradesPage() {
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await axios.get(`${API_BASE}/assessments/my-grades`);
        setGrades(res.data.grades || []);
      } catch (err) {
        setError('Failed to load your grades. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchGrades();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-content-secondary">Loading your grades...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-error-600">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto my-10 px-5 bg-surface rounded-xl shadow-lg">
      <div className="flex items-center gap-5 mb-8 pt-8 px-8">
        <button
          onClick={() => navigate('/home')}
          className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
        >
          Back to Home
        </button>
        <h1 className="text-2xl font-bold text-brand-500 text-center flex-1 m-0">My Grades & Feedback</h1>
      </div>

      {grades.length === 0 ? (
        <p className="text-center text-content-secondary py-8 px-8">No grades have been posted yet.</p>
      ) : (
        <div className="overflow-x-auto pb-8 px-8">
          <table className="w-full border-collapse mt-5">
            <thead>
              <tr className="bg-surface-tertiary">
                <th className="px-3 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">Course</th>
                <th className="px-3 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">Assessment</th>
                <th className="px-3 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">Type</th>
                <th className="px-3 py-3 text-center border-b-2 border-border text-sm font-semibold text-content">Score</th>
                <th className="px-3 py-3 text-center border-b-2 border-border text-sm font-semibold text-content">Out of</th>
                <th className="px-3 py-3 text-center border-b-2 border-border text-sm font-semibold text-content">Percentage</th>
                <th className="px-3 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">Feedback</th>
                <th className="px-3 py-3 text-left border-b-2 border-border text-sm font-semibold text-content">Graded On</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={grade._id} className="hover:bg-surface-hover transition-colors">
                  <td className="px-3 py-3 border-b border-border-light text-sm text-content">{grade.assessment.course.code} - {grade.assessment.course.title}</td>
                  <td className="px-3 py-3 border-b border-border-light text-sm font-medium text-content">{grade.assessment.title}</td>
                  <td className="px-3 py-3 border-b border-border-light text-sm">
                    <span className="inline-block px-2 py-1 bg-info-100 text-info-700 rounded text-xs font-semibold uppercase">
                      {grade.assessment.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 border-b border-border-light text-sm text-center font-bold text-brand-500">
                    {grade.score !== null ? grade.score : '—'}
                  </td>
                  <td className="px-3 py-3 border-b border-border-light text-sm text-center text-content">{grade.assessment.totalMarks}</td>
                  <td className="px-3 py-3 border-b border-border-light text-sm text-center font-semibold text-content">
                    {grade.score !== null
                      ? `${((grade.score / grade.assessment.totalMarks) * 100).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="px-3 py-3 border-b border-border-light text-sm text-content-secondary italic">
                    {grade.feedback || <em className="text-content-tertiary">No feedback provided</em>}
                  </td>
                  <td className="px-3 py-3 border-b border-border-light text-sm text-content">{new Date(grade.gradedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default MyGradesPage;