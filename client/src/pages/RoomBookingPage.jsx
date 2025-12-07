import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { roomService, bookingService } from '../services/bookingService.js';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, X, Check, AlertCircle } from 'lucide-react';

const ROOM_TYPES = {
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

function RoomBookingPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // State
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create'); // 'create' or 'view'
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        roomId: '',
        date: '',
        startTime: '',
        endTime: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Filter state
    const [roomTypeFilter, setRoomTypeFilter] = useState('all');
    const [buildingFilter, setBuildingFilter] = useState('all');

    // Get unique buildings from rooms
    const buildings = [...new Set(rooms.map(r => r.building))];

    // Filter rooms
    const filteredRooms = rooms.filter(room => {
        if (roomTypeFilter !== 'all' && room.type !== roomTypeFilter) return false;
        if (buildingFilter !== 'all' && room.building !== buildingFilter) return false;
        return true;
    });

    // Helper functions
    function getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getWeekDays(weekStart) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }

    function formatDate(date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function formatTime(date) {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function isSameDay(date1, date2) {
        return date1.toDateString() === date2.toDateString();
    }

    // Fetch data
    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (selectedRoom) {
            fetchBookingsForRoom(selectedRoom.id);
        }
    }, [selectedRoom, currentWeekStart]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await roomService.getAll({ isAvailable: true });
            setRooms(response.rooms || []);
            if (response.rooms?.length > 0) {
                setSelectedRoom(response.rooms[0]);
            }
        } catch (err) {
            setError('Failed to load rooms');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingsForRoom = async (roomId) => {
        try {
            const weekEnd = new Date(currentWeekStart);
            weekEnd.setDate(weekEnd.getDate() + 7);
            
            const response = await bookingService.getByRoom(roomId, {
                startDate: currentWeekStart.toISOString(),
                endDate: weekEnd.toISOString()
            });
            setBookings(response.bookings || []);
        } catch (err) {
            console.error('Failed to load bookings', err);
        }
    };

    // Navigation
    const goToPreviousWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const goToNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const goToToday = () => {
        setCurrentWeekStart(getWeekStart(new Date()));
        setSelectedDate(new Date());
    };

    // Modal handlers
    const openCreateModal = (date, hour = 9) => {
        const startTime = `${hour.toString().padStart(2, '0')}:00`;
        const endHour = hour + 1;
        const endTime = `${endHour.toString().padStart(2, '0')}:00`;
        
        setFormData({
            title: '',
            description: '',
            roomId: selectedRoom?.id || '',
            date: date.toISOString().split('T')[0],
            startTime,
            endTime,
            notes: ''
        });
        setModalMode('create');
        setFormError('');
        setSuccessMessage('');
        setIsModalOpen(true);
    };

    const openViewModal = (booking) => {
        setSelectedBooking(booking);
        setModalMode('view');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedBooking(null);
        setFormError('');
        setSuccessMessage('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Client-side conflict check
    const checkClientSideConflict = (roomId, startTime, endTime) => {
        const roomBookings = bookings.filter(b =>
            (b.room?.id === roomId || b.room === roomId) &&
            b.status !== 'cancelled'
        );

        for (const booking of roomBookings) {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);

            // Check for overlap: new booking overlaps if it starts before existing ends AND ends after existing starts
            if (startTime < bookingEnd && endTime > bookingStart) {
                return booking;
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        setSuccessMessage('');
        setSubmitting(true);

        try {
            const startTime = new Date(`${formData.date}T${formData.startTime}`);
            const endTime = new Date(`${formData.date}T${formData.endTime}`);

            if (startTime >= endTime) {
                setFormError('End time must be after start time');
                setSubmitting(false);
                return;
            }

            // Client-side conflict check
            const conflictingBooking = checkClientSideConflict(
                parseInt(formData.roomId),
                startTime,
                endTime
            );

            if (conflictingBooking) {
                setFormError(`This time slot conflicts with "${conflictingBooking.title}" (${formatTime(conflictingBooking.startTime)} - ${formatTime(conflictingBooking.endTime)})`);
                setSubmitting(false);
                return;
            }

            const bookingData = {
                title: formData.title,
                description: formData.description,
                roomId: parseInt(formData.roomId),
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                notes: formData.notes
            };

            const response = await bookingService.create(bookingData);

            if (response.success) {
                setSuccessMessage('Room booked successfully!');
                fetchBookingsForRoom(selectedRoom.id);
                setTimeout(() => {
                    closeModal();
                }, 1500);
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        
        try {
            await bookingService.cancel(bookingId);
            fetchBookingsForRoom(selectedRoom.id);
            closeModal();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    // Get bookings for a specific day
    const getBookingsForDay = (date) => {
        return bookings.filter(b => isSameDay(new Date(b.startTime), date));
    };

    // Time slots (8 AM to 8 PM)
    const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-content">Loading rooms...</div>
            </div>
        );
    }

    const weekDays = getWeekDays(currentWeekStart);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <nav className="bg-indigo-600 text-white px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-indigo-200 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/admin/home')}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                            ← Back to Dashboard
                        </button>
                        <span className="text-sm font-medium text-indigo-200">
                            {user?.name}
                        </span>
                        <button
                            onClick={handleLogout}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Room Booking</h2>
                    <p className="text-gray-600 mt-2">Book classrooms and labs for your lectures and sessions</p>
                </div>

                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Room List Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-md p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Rooms</h3>
                            
                            {/* Filters */}
                            <div className="space-y-3 mb-4">
                                <select
                                    value={roomTypeFilter}
                                    onChange={(e) => setRoomTypeFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">All Types</option>
                                    {Object.entries(ROOM_TYPES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                                <select
                                    value={buildingFilter}
                                    onChange={(e) => setBuildingFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="all">All Buildings</option>
                                    {buildings.map(b => (
                                        <option key={b} value={b}>{b}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Room List */}
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredRooms.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">No rooms available</p>
                                ) : (
                                    filteredRooms.map(room => (
                                        <div
                                            key={room.id}
                                            onClick={() => setSelectedRoom(room)}
                                            className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                selectedRoom?.id === room.id
                                                    ? 'bg-indigo-100 border-2 border-indigo-500'
                                                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                            }`}
                                        >
                                            <div className="font-medium text-gray-900">{room.name}</div>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                                                <MapPin size={14} />
                                                <span>{room.building}, Floor {room.floor}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${ROOM_TYPE_COLORS[room.type]}`}>
                                                    {ROOM_TYPES[room.type]}
                                                </span>
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Users size={12} />
                                                    {room.capacity}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Calendar View */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-lg shadow-md">
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={goToPreviousWeek}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={goToNextWeek}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                    <button
                                        onClick={goToToday}
                                        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        Today
                                    </button>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </h3>
                                {selectedRoom && (
                                    <div className="text-sm text-gray-600">
                                        Viewing: <span className="font-medium">{selectedRoom.name}</span>
                                    </div>
                                )}
                            </div>

                            {/* Calendar Grid - Continued in next part */}
                            <div className="overflow-x-auto">
                                <div className="min-w-[800px]">
                                    {/* Day Headers */}
                                    <div className="grid grid-cols-8 border-b">
                                        <div className="p-2 text-center text-sm font-medium text-gray-500 border-r">
                                            Time
                                        </div>
                                        {weekDays.map((day, idx) => (
                                            <div
                                                key={idx}
                                                className={`p-2 text-center border-r last:border-r-0 ${
                                                    isSameDay(day, new Date()) ? 'bg-indigo-50' : ''
                                                }`}
                                            >
                                                <div className="text-sm font-medium text-gray-900">
                                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                                </div>
                                                <div className={`text-lg ${
                                                    isSameDay(day, new Date()) 
                                                        ? 'bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto'
                                                        : 'text-gray-600'
                                                }`}>
                                                    {day.getDate()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Time Slots */}
                                    <div className="max-h-[500px] overflow-y-auto">
                                        {timeSlots.map(hour => (
                                            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
                                                <div className="p-2 text-center text-sm text-gray-500 border-r bg-gray-50">
                                                    {hour}:00
                                                </div>
                                                {weekDays.map((day, dayIdx) => {
                                                    const dayBookings = getBookingsForDay(day);
                                                    const slotBooking = dayBookings.find(b => {
                                                        const startHour = new Date(b.startTime).getHours();
                                                        const endHour = new Date(b.endTime).getHours();
                                                        return hour >= startHour && hour < endHour;
                                                    });
                                                    const isStartHour = slotBooking && new Date(slotBooking.startTime).getHours() === hour;
                                                    const isPast = day < new Date() && !isSameDay(day, new Date());
                                                    const isBooked = !!slotBooking;

                                                    return (
                                                        <div
                                                            key={dayIdx}
                                                            className={`p-1 border-r last:border-r-0 min-h-[60px] transition-colors ${
                                                                isPast
                                                                    ? 'bg-gray-100 cursor-not-allowed'
                                                                    : isBooked && !isStartHour
                                                                        ? 'bg-indigo-100 cursor-pointer'
                                                                        : isBooked
                                                                            ? 'cursor-pointer'
                                                                            : 'hover:bg-indigo-50 cursor-pointer'
                                                            } ${isSameDay(day, new Date()) && !isBooked ? 'bg-indigo-50/50' : ''}`}
                                                            onClick={() => {
                                                                if (isPast) return;
                                                                if (slotBooking) {
                                                                    openViewModal(slotBooking);
                                                                } else {
                                                                    openCreateModal(day, hour);
                                                                }
                                                            }}
                                                        >
                                                            {isStartHour && slotBooking && (
                                                                <div className="bg-indigo-600 text-white text-xs p-1 rounded">
                                                                    <div className="font-medium truncate">{slotBooking.title}</div>
                                                                    <div className="text-indigo-200">
                                                                        {formatTime(slotBooking.startTime)} - {formatTime(slotBooking.endTime)}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {isBooked && !isStartHour && (
                                                                <div className="h-full w-full bg-indigo-200 rounded opacity-50"></div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {modalMode === 'create' ? 'Book Room' : 'Booking Details'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {successMessage && (
                                <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4">
                                    <Check size={20} />
                                    {successMessage}
                                </div>
                            )}

                            {formError && (
                                <div className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    <AlertCircle size={20} />
                                    {formError}
                                </div>
                            )}

                            {modalMode === 'create' ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Booking Title *
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleInputChange}
                                            placeholder="e.g., CS101 Lecture"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Room
                                        </label>
                                        <select
                                            name="roomId"
                                            value={formData.roomId}
                                            onChange={handleInputChange}
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            {rooms.map(room => (
                                                <option key={room.id} value={room.id}>
                                                    {room.name} - {room.building} ({ROOM_TYPES[room.type]})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Date *
                                        </label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleInputChange}
                                            required
                                            min={new Date().toISOString().split('T')[0]}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Start Time *
                                            </label>
                                            <input
                                                type="time"
                                                name="startTime"
                                                value={formData.startTime}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                End Time *
                                            </label>
                                            <input
                                                type="time"
                                                name="endTime"
                                                value={formData.endTime}
                                                onChange={handleInputChange}
                                                required
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            placeholder="Optional description..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            rows={2}
                                            placeholder="Any special requirements..."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            disabled={submitting}
                                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                        >
                                            {submitting ? 'Booking...' : 'Book Room'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                /* View Mode */
                                selectedBooking && (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-900">{selectedBooking.title}</h4>
                                            {selectedBooking.description && (
                                                <p className="text-gray-600 mt-1">{selectedBooking.description}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Calendar size={18} />
                                                <span>{new Date(selectedBooking.startTime).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Clock size={18} />
                                                <span>
                                                    {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 text-gray-600">
                                            <MapPin size={18} />
                                            <span>
                                                {selectedBooking.room?.name} - {selectedBooking.room?.building}
                                            </span>
                                        </div>

                                        <div className="text-sm text-gray-500">
                                            Booked by: {selectedBooking.bookedBy?.name}
                                        </div>

                                        {selectedBooking.notes && (
                                            <div className="bg-gray-50 p-3 rounded-lg">
                                                <div className="text-sm font-medium text-gray-700">Notes:</div>
                                                <div className="text-gray-600">{selectedBooking.notes}</div>
                                            </div>
                                        )}

                                        {/* Show cancel button only if user owns the booking */}
                                        {selectedBooking.bookedBy?.id === user?.id && (
                                            <div className="flex justify-end pt-4 border-t">
                                                <button
                                                    onClick={() => handleCancelBooking(selectedBooking.id)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                                                >
                                                    Cancel Booking
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default RoomBookingPage;

