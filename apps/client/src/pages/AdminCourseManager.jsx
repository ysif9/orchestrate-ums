import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import '../styles/AdminCourseManager.css';

const AdminCourseManager = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    code: '',
    title: '',
    description: '',
    type: 'Core',
    credits: 3,
    semester: '',
    prerequisites: []
  };
  const [formData, setFormData] = useState(initialFormState);

  // Multi-select state
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await courseService.getAll();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (course = null) => {
    if (course) {
      setCurrentCourse(course);
      setFormData({
        ...course,
        prerequisites: course.prerequisites || []
      });
    } else {
      setCurrentCourse(null);
      setFormData(initialFormState);
    }
    setError('');
    setSearchTerm('');
    setIsDropdownOpen(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setError('');
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    // Validate that course is not its own prerequisite
    if (currentCourse && formData.prerequisites.includes(currentCourse._id)) {
      setError('A course cannot be its own prerequisite');
      setSubmitting(false);
      return;
    }

    const payload = {
      ...formData,
      prerequisites: formData.prerequisites
    };

    try {
      if (currentCourse) {
        await courseService.update(currentCourse._id, payload);
      } else {
        await courseService.create(payload);
      }
      await fetchCourses();
      handleCloseModal();
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle prerequisite selection
  const handlePrerequisiteToggle = (courseId) => {
    setFormData(prev => {
      const isSelected = prev.prerequisites.includes(courseId);
      return {
        ...prev,
        prerequisites: isSelected
          ? prev.prerequisites.filter(id => id !== courseId)
          : [...prev.prerequisites, courseId]
      };
    });
  };

  const handleRemovePrerequisite = (courseId) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(id => id !== courseId)
    }));
  };

  // Get available courses for prerequisites (excluding current course)
  const getAvailableCourses = () => {
    return courses.filter(course => {
      // Exclude current course being edited
      if (currentCourse && course._id === currentCourse._id) {
        return false;
      }
      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          course.code.toLowerCase().includes(search) ||
          course.title.toLowerCase().includes(search)
        );
      }
      return true;
    });
  };

  // Get selected prerequisite courses
  const getSelectedPrerequisites = () => {
    return courses.filter(course =>
      formData.prerequisites.includes(course._id)
    );
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await courseService.delete(id);
        fetchCourses();
      } catch (error) {
        console.error('Delete failed', error);
      }
    }
  };

  if (loading) return <div className="admin-container">Loading...</div>;

  return (
    <div className="admin-container">
      <div className="admin-wrapper">

        {/* Header */}
        <header className="admin-header">
          <div className="admin-title">
            <h1>Course Management</h1>
            <p>Create, edit, and manage university curriculum</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <span>+</span> Create Course
          </button>
        </header>

        {/* Data Table */}
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th width="10%">Code</th>
                <th width="30%">Title</th>
                <th width="15%">Type</th>
                <th width="10%">Credits</th>
                <th width="15%">Semester</th>
                <th width="20%">Prerequisites</th>
                <th width="15%" style={{textAlign: 'right'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{textAlign: 'center', padding: '2rem'}}>
                    No courses found. Add one to get started.
                  </td>
                </tr>
              ) : (
                courses.map(course => (
                  <tr key={course._id}>
                    <td><strong>{course.code}</strong></td>
                    <td>{course.title}</td>
                    <td>
                      <span className={`badge ${course.type === 'Core' ? 'badge-core' : 'badge-elective'}`}>
                        {course.type}
                      </span>
                    </td>
                    <td>{course.credits}</td>
                    <td>{course.semester || 'Not set'}</td>
                    <td style={{color: '#64748b'}}>
                      {course.prerequisites?.length > 0
                        ? course.prerequisites
                            .map(prereqId => {
                              const prereqCourse = courses.find(c => c._id === prereqId);
                              return prereqCourse ? prereqCourse.code : prereqId;
                            })
                            .join(', ')
                        : 'None'}
                    </td>
                    <td>
                      <div className="action-buttons" style={{justifyContent: 'flex-end'}}>
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenModal(course)}
                          title="Edit"
                        >
                          ✎
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(course._id)}
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button className="btn-icon" onClick={handleCloseModal}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="error-message">
                  {error}
                </div>
              )}

              <div className="form-grid">
                <div className="form-group">
                  <label>Course Code</label>
                  <input
                    className="form-input"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Credits</label>
                  <input
                    type="number"
                    className="form-input"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Course Title</label>
                  <input
                    className="form-input"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    className="form-textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed course description..."
                  />
                </div>

                <div className="form-group">
                  <label>Type</label>
                  <select
                    className="form-select"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Semester (e.g., Fall 2024)</label>
                  <input
                    className="form-input"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder="Fall 2024"
                  />
                </div>

                <div className="form-group">
                  <label>Prerequisites</label>
                  <div className="multi-select-container">
                    {/* Selected Prerequisites */}
                    <div className="selected-items">
                      {getSelectedPrerequisites().length > 0 ? (
                        getSelectedPrerequisites().map(course => (
                          <div key={course._id} className="selected-item">
                            <span>{course.code} - {course.title}</span>
                            <button
                              type="button"
                              className="remove-item"
                              onClick={() => handleRemovePrerequisite(course._id)}
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="placeholder-text">No prerequisites selected</div>
                      )}
                    </div>

                    {/* Search Input */}
                    <div className="search-input-wrapper">
                      <input
                        type="text"
                        className="form-input search-input"
                        placeholder="Search courses to add..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                    </div>

                    {/* Dropdown List */}
                    {isDropdownOpen && (
                      <>
                        <div
                          className="dropdown-overlay"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="dropdown-list">
                          {getAvailableCourses().length > 0 ? (
                            getAvailableCourses().map(course => (
                              <div
                                key={course._id}
                                className={`dropdown-item ${
                                  formData.prerequisites.includes(course._id) ? 'selected' : ''
                                }`}
                                onClick={() => handlePrerequisiteToggle(course._id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.prerequisites.includes(course._id)}
                                  onChange={() => {}}
                                  className="dropdown-checkbox"
                                />
                                <div className="dropdown-item-content">
                                  <strong>{course.code}</strong>
                                  <span className="dropdown-item-title">{course.title}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="dropdown-empty">
                              {searchTerm ? 'No courses found' : 'No courses available'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : (currentCourse ? 'Save Changes' : 'Create Course')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourseManager;