import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/bookingService.js';

const ROOM_TYPES = [
    { value: 'classroom', label: 'Classroom' },
    { value: 'lab', label: 'Lab' },
    { value: 'lecture_hall', label: 'Lecture Hall' },
    { value: 'conference_room', label: 'Conference Room' }
];

const ROOM_TYPE_LABELS = {
    classroom: 'Classroom',
    lab: 'Lab',
    lecture_hall: 'Lecture Hall',
    conference_room: 'Conference Room'
};

const ROOM_TYPE_COLORS = {
    classroom: 'bg-blue-100 text-blue-800',
    lab: 'bg-purple-100 text-purple-800',
    lecture_hall: 'bg-green-100 text-green-800',
    conference_room: 'bg-orange-100 text-orange-800'
};

const AdminRoomManager = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const initialFormState = {
        name: '',
        building: '',
        floor: 0,
        capacity: 30,
        type: 'classroom',
        description: '',
        amenities: '',
        isAvailable: true
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchRooms();
    }, []);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await roomService.getAll();
            setRooms(response.rooms || []);
        } catch (err) {
            setError('Failed to fetch rooms');
            console.error('Failed to fetch rooms', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (room = null) => {
        if (room) {
            setCurrentRoom(room);
            setFormData({
                name: room.name || '',
                building: room.building || '',
                floor: room.floor || 0,
                capacity: room.capacity || 30,
                type: room.type || 'classroom',
                description: room.description || '',
                amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : '',
                isAvailable: room.isAvailable !== false
            });
        } else {
            setCurrentRoom(null);
            setFormData(initialFormState);
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormState);
        setError('');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        // Parse amenities from comma-separated string to array
        const amenitiesArray = formData.amenities
            .split(',')
            .map(a => a.trim())
            .filter(a => a.length > 0);

        const payload = {
            name: formData.name,
            building: formData.building,
            floor: parseInt(formData.floor),
            capacity: parseInt(formData.capacity),
            type: formData.type,
            description: formData.description || undefined,
            amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
            isAvailable: formData.isAvailable
        };

        try {
            if (currentRoom) {
                await roomService.update(currentRoom.id, payload);
                setSuccessMessage('Room updated successfully');
            } else {
                await roomService.create(payload);
                setSuccessMessage('Room created successfully');
            }
            await fetchRooms();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            try {
                await roomService.delete(id);
                setSuccessMessage('Room deleted successfully');
                fetchRooms();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to delete room');
                console.error('Delete failed', err);
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-content">Loading...</div>;

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-success-100 text-success-700 px-4 py-3 rounded-lg mb-4 text-sm border border-success-200">
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && !isModalOpen && (
                    <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm border border-error-200">
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center mb-8 gap-4">
                    <button
                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
                        onClick={() => navigate('/admin/home')}
                    >
                        ← Back to Home
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-content m-0">Room Management</h1>
                        <p className="text-content-secondary mt-2">Add, edit, and manage classrooms and labs</p>
                    </div>
                    <button
                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
                        onClick={() => handleOpenModal()}
                    >
                        <span className="text-lg">+</span> Create Room
                    </button>
                </header>

                {/* Data Table */}
                <div className="bg-surface rounded-lg shadow-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Room Name</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Building</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Floor</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Type</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Capacity</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Amenities</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-left">Status</th>
                                    <th className="bg-surface-tertiary text-content-secondary font-semibold px-6 py-4 border-b border-border text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rooms.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center p-8 text-content-secondary">
                                            No rooms found. Add one to get started.
                                        </td>
                                    </tr>
                                ) : (
                                    rooms.map(room => (
                                        <tr key={room.id} className="hover:bg-surface-hover transition-colors">
                                            <td className="px-6 py-4 border-b border-border align-middle">
                                                <strong className="font-semibold text-content">{room.name}</strong>
                                            </td>
                                            <td className="px-6 py-4 border-b border-border align-middle text-content">{room.building}</td>
                                            <td className="px-6 py-4 border-b border-border align-middle text-content">{room.floor}</td>
                                            <td className="px-6 py-4 border-b border-border align-middle">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ROOM_TYPE_COLORS[room.type] || 'bg-gray-100 text-gray-800'}`}>
                                                    {ROOM_TYPE_LABELS[room.type] || room.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-border align-middle text-content">{room.capacity}</td>
                                            <td className="px-6 py-4 border-b border-border align-middle text-content-tertiary">
                                                {Array.isArray(room.amenities) && room.amenities.length > 0
                                                    ? room.amenities.join(', ')
                                                    : 'None'}
                                            </td>
                                            <td className="px-6 py-4 border-b border-border align-middle">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    room.isAvailable !== false
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {room.isAvailable !== false ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 border-b border-border align-middle">
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center bg-info-600 hover:bg-info-700 text-content-inverse rounded transition-colors text-lg"
                                                        onClick={() => handleOpenModal(room)}
                                                        title="Edit"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        className="w-8 h-8 flex items-center justify-center bg-error-600 hover:bg-error-700 text-content-inverse rounded transition-colors text-lg"
                                                        onClick={() => handleDelete(room.id)}
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
                            <h2 className="text-xl font-semibold m-0 text-content">{currentRoom ? 'Edit Room' : 'Create New Room'}</h2>
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
                                    <label className="text-sm font-medium mb-2 text-content">Room Name *</label>
                                    <input
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Room 101"
                                        required
                                    />
                                </div>

                                <div className="mb-4 flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Building *</label>
                                    <input
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="building"
                                        value={formData.building}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Engineering Building A"
                                        required
                                    />
                                </div>

                                <div className="mb-4 flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Floor *</label>
                                    <input
                                        type="number"
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="floor"
                                        value={formData.floor}
                                        onChange={handleInputChange}
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="mb-4 flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Capacity *</label>
                                    <input
                                        type="number"
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleInputChange}
                                        min="1"
                                        required
                                    />
                                </div>

                                <div className="mb-4 flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Type *</label>
                                    <select
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {ROOM_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mb-4 flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Availability</label>
                                    <div className="flex items-center h-[42px]">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isAvailable"
                                                checked={formData.isAvailable}
                                                onChange={handleInputChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                            <span className="ml-3 text-sm text-content">
                                                {formData.isAvailable ? 'Available' : 'Unavailable'}
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                <div className="mb-4 flex flex-col col-span-2">
                                    <label className="text-sm font-medium mb-2 text-content">Description</label>
                                    <textarea
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 min-h-[80px] resize-y"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Optional room description..."
                                    />
                                </div>

                                <div className="mb-4 flex flex-col col-span-2">
                                    <label className="text-sm font-medium mb-2 text-content">Amenities</label>
                                    <input
                                        className="px-2.5 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="amenities"
                                        value={formData.amenities}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Projector, Whiteboard, AC (comma-separated)"
                                    />
                                    <p className="text-xs text-content-tertiary mt-1">Enter amenities separated by commas</p>
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
                                    {submitting ? 'Saving...' : (currentRoom ? 'Save Changes' : 'Create Room')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminRoomManager;

