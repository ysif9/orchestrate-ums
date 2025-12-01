import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';

const AdminCourseManager = () => {
  const navigate = useNavigate();
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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-content">Loading...</div>;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <header className="flex justify-between items-center mb-8 gap-4">
          <button
            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
            onClick={() => navigate('/admin/home')}
          >
            ← Back to Home
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-content m-0">Course Management</h1>
            <p className="text-content-secondary mt-2">Create, edit, and manage university curriculum</p>
          </div>
          <button
            className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
            onClick={() => handleOpenModal()}
          >
            <span className="text-lg">+</span> Create Course
          </button>
        </header>

        {/* Data Table */}
        <div className="bg-surface rounded-lg shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[10%]">Code</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[30%]">Title</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[15%]">Type</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[10%]">Credits</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[15%]">Semester</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left w-[20%]">Prerequisites</th>
                  <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-right w-[15%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-content-secondary">
                      No courses found. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  courses.map(course => (
                    <tr key={course._id} className="hover:bg-surface-hover transition-colors">
                      <td className="px-6 py-4 border-b border-border align-middle">
                        <strong className="font-semibold text-content">{course.code}</strong>
                      </td>
                      <td className="px-6 py-4 border-b border-border align-middle text-content">{course.title}</td>
                      <td className="px-6 py-4 border-b border-border align-middle">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${course.type === 'Core'
                            ? 'bg-course-core-bg text-course-core'
                            : 'bg-course-elective-bg text-course-elective'
                          }`}>
                          {course.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-b border-border align-middle text-content">{course.credits}</td>
                      <td className="px-6 py-4 border-b border-border align-middle text-content">{course.semester || 'Not set'}</td>
                      <td className="px-6 py-4 border-b border-border align-middle text-content-tertiary">
                        {course.prerequisites?.length > 0
                          ? course.prerequisites
                            .map(prereq => {
                              // Check if prereq is already populated (object with code property)
                              if (typeof prereq === 'object' && prereq.code) {
                                return prereq.code;
                              }
                              // Otherwise, it's just an ID, so find the course
                              const prereqCourse = courses.find(c => c._id === prereq);
                              return prereqCourse ? prereqCourse.code : prereq;
                            })
                            .join(', ')
                          : 'None'}
                      </td>
                      <td className="px-6 py-4 border-b border-border align-middle">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-info-600 hover:bg-info-700 text-content-inverse rounded transition-colors text-lg"
                            onClick={() => handleOpenModal(course)}
                            title="Edit"
                          >
                            ✎
                          </button>
                          <button
                            className="w-8 h-8 flex items-center justify-center bg-error-600 hover:bg-error-700 text-content-inverse rounded transition-colors text-lg"
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
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-surface rounded-lg shadow-modal max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4 px-8 pt-8">
              <h2 className="text-xl font-semibold m-0 text-content">{currentCourse ? 'Edit Course' : 'Create New Course'}</h2>
              <button
                className="w-8 h-8 flex items-center justify-center bg-surface-tertiary hover:bg-surface-hover text-content-secondary rounded transition-colors text-lg"
                onClick={handleCloseModal}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-8 pb-8">
              {error && (
                <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm border border-error-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="mb-4 flex flex-col">
                  <label className="text-sm font-medium mb-2 text-content">Course Code</label>
                  <input
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="e.g. CS101"
                    required
                  />
                </div>

                <div className="mb-4 flex flex-col">
                  <label className="text-sm font-medium mb-2 text-content">Credits</label>
                  <input
                    type="number"
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    name="credits"
                    value={formData.credits}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </div>

                <div className="mb-4 flex flex-col col-span-2">
                  <label className="text-sm font-medium mb-2 text-content">Course Title</label>
                  <input
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Introduction to Computer Science"
                    required
                  />
                </div>

                <div className="mb-4 flex flex-col col-span-2">
                  <label className="text-sm font-medium mb-2 text-content">Description</label>
                  <textarea
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 min-h-[100px] resize-y"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed course description..."
                  />
                </div>

                <div className="mb-4 flex flex-col">
                  <label className="text-sm font-medium mb-2 text-content">Type</label>
                  <select
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="Core">Core</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>

                <div className="mb-4 flex flex-col">
                  <label className="text-sm font-medium mb-2 text-content">Semester (e.g., Fall 2024)</label>
                  <input
                    className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    name="semester"
                    value={formData.semester}
                    onChange={handleInputChange}
                    placeholder="Fall 2024"
                  />
                </div>

                <div className="mb-4 flex flex-col">
                  <label className="text-sm font-medium mb-2 text-content">Prerequisites</label>
                  <div className="relative">
                    {/* Selected Prerequisites */}
                    <div className="border border-border rounded-md p-3 mb-2 min-h-[60px] bg-surface-tertiary">
                      {getSelectedPrerequisites().length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {getSelectedPrerequisites().map(course => (
                            <div key={course._id} className="inline-flex items-center gap-2 bg-brand-500 text-content-inverse px-3 py-1 rounded-full text-sm">
                              <span>{course.code} - {course.title}</span>
                              <button
                                type="button"
                                className="hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                                onClick={() => handleRemovePrerequisite(course._id)}
                                title="Remove"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-content-tertiary text-sm">No prerequisites selected</div>
                      )}
                    </div>

                    {/* Search Input */}
                    <div>
                      <input
                        type="text"
                        className="w-full px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
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
                          className="fixed inset-0 z-10"
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {getAvailableCourses().length > 0 ? (
                            getAvailableCourses().map(course => (
                              <div
                                key={course._id}
                                className={`px-3 py-2 cursor-pointer hover:bg-surface-hover transition-colors flex items-center gap-2 ${formData.prerequisites.includes(course._id) ? 'bg-brand-50' : ''
                                  }`}
                                onClick={() => handlePrerequisiteToggle(course._id)}
                              >
                                <input
                                  type="checkbox"
                                  checked={formData.prerequisites.includes(course._id)}
                                  onChange={() => { }}
                                  className="w-4 h-4 accent-brand-500"
                                />
                                <div className="flex-1">
                                  <strong className="text-sm text-content">{course.code}</strong>
                                  <span className="text-sm text-content-secondary ml-2">{course.title}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-3 py-4 text-center text-content-secondary text-sm">
                              {searchTerm ? 'No courses found' : 'No courses available'}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  type="button"
                  className="px-5 py-2.5 border border-border rounded-lg text-content hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-content-inverse rounded-lg transition-colors shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
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