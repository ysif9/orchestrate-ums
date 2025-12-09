import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { labStationService, labReservationService } from '../services/labStationService.js';
import { MapPin, Clock, Monitor, AlertCircle, Check, X, Users, Calendar } from 'lucide-react';

const STATION_STATUS_COLORS = {
    available: 'bg-green-100 border-green-500 text-green-800',
    reserved: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    occupied: 'bg-red-100 border-red-500 text-red-800',
    out_of_service: 'bg-gray-100 border-gray-500 text-gray-500'
};

const STATION_STATUS_LABELS = {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    out_of_service: 'Out of Service'
};

const MAX_RESERVATION_HOURS = 4;

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function LabStationBookingPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // State
    const [labs, setLabs] = useState([]);
    const [selectedLab, setSelectedLab] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeReservation, setActiveReservation] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [formData, setFormData] = useState({
        date: getLocalDateString(),
        startTime: '',
        endTime: '',
        purpose: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Expiration alert state
    const [expirationAlert, setExpirationAlert] = useState(null);

    // Fetch labs on mount
    useEffect(() => {
        fetchLabs();
        checkActiveReservation();
    }, []);

    // Fetch stations when lab is selected
    useEffect(() => {
        if (selectedLab) {
            fetchStations(selectedLab.id);
        }
    }, [selectedLab]);

    // Check for expiring reservations periodically
    useEffect(() => {
        const checkExpiring = async () => {
            try {
                const response = await labReservationService.checkExpiring();
                if (response.hasExpiringReservation) {
                    setExpirationAlert(response.reservation);
                }
            } catch (err) {
                console.error('Error checking expiring reservations:', err);
            }
        };

        checkExpiring();
        const interval = setInterval(checkExpiring, 60000); // Check every minute
        return () => clearInterval(interval);
    }, []);

    const fetchLabs = async () => {
        try {
            setLoading(true);
            const response = await labStationService.getLabs();
            setLabs(response.labs || []);
            if (response.labs?.length > 0) {
                setSelectedLab(response.labs[0]);
            }
        } catch (err) {
            setError('Failed to load labs');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStations = async (labId) => {
        try {
            const response = await labStationService.getStationsByLab(labId);
            setStations(response.stations || []);
        } catch (err) {
            console.error('Failed to load stations', err);
        }
    };

    const checkActiveReservation = async () => {
        try {
            const response = await labReservationService.getMyActive();
            setActiveReservation(response.reservation);
        } catch (err) {
            console.error('Error checking active reservation:', err);
        }
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const openReservationModal = (station) => {
        if (activeReservation) {
            setFormError('You already have an active reservation. Please complete or cancel it first.');
            return;
        }
        if (station.status !== 'available') {
            return;
        }
        setSelectedStation(station);
        const now = new Date();
        const startHour = now.getHours() + 1;
        setFormData({
            date: getLocalDateString(),
            startTime: `${startHour.toString().padStart(2, '0')}:00`,
            endTime: `${(startHour + 1).toString().padStart(2, '0')}:00`,
            purpose: '',
            notes: ''
        });
        setFormError('');
        setSuccessMessage('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStation(null);
        setFormError('');
        setSuccessMessage('');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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

            const durationHours = (endTime - startTime) / (1000 * 60 * 60);
            if (durationHours > MAX_RESERVATION_HOURS) {
                setFormError(`Reservation cannot exceed ${MAX_RESERVATION_HOURS} hours`);
                setSubmitting(false);
                return;
            }

            const reservationData = {
                stationId: selectedStation.id,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                purpose: formData.purpose,
                notes: formData.notes
            };

            const response = await labReservationService.create(reservationData);

            if (response.success) {
                setSuccessMessage('Station reserved successfully!');
                checkActiveReservation();
                fetchStations(selectedLab.id);
                setTimeout(() => {
                    closeModal();
                }, 1500);
            }
        } catch (err) {
            setFormError(err.response?.data?.message || 'Failed to create reservation');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelReservation = async () => {
        if (!activeReservation) return;
        if (!window.confirm('Are you sure you want to cancel your reservation?')) return;

        try {
            await labReservationService.cancel(activeReservation.id);
            setActiveReservation(null);
            if (selectedLab) {
                fetchStations(selectedLab.id);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to cancel reservation');
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-content">Loading labs...</div>
            </div>
        );
    }

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
                            onClick={() => navigate('/home')}
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
                    <h2 className="text-3xl font-bold text-gray-900">Lab Station Reservation</h2>
                    <p className="text-gray-600 mt-2">Reserve a workstation for your study sessions</p>
                </div>

                {/* Expiration Alert */}
                {expirationAlert && (
                    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4 mb-6 rounded-r-lg flex items-center gap-3">
                        <AlertCircle size={24} />
                        <div>
                            <p className="font-semibold">Your reservation is expiring soon!</p>
                            <p className="text-sm">
                                Station {expirationAlert.station?.stationNumber} at {expirationAlert.station?.lab?.name}
                                expires at {formatTime(expirationAlert.endTime)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Active Reservation Banner */}
                {activeReservation && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Monitor className="text-blue-600" size={24} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-blue-900">Active Reservation</h3>
                                    <p className="text-blue-700 text-sm">
                                        Station {activeReservation.station?.stationNumber} at {activeReservation.station?.lab?.name}
                                    </p>
                                    <p className="text-blue-600 text-sm">
                                        {formatDate(activeReservation.startTime)} • {formatTime(activeReservation.startTime)} - {formatTime(activeReservation.endTime)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCancelReservation}
                                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors text-sm font-medium"
                            >
                                Cancel Reservation
                            </button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Lab Selection */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Lab Location</h3>
                    <div className="flex flex-wrap gap-3">
                        {labs.map(lab => (
                            <button
                                key={lab.id}
                                onClick={() => setSelectedLab(lab)}
                                className={`px-4 py-3 rounded-lg border-2 transition-all ${selectedLab?.id === lab.id
                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                        : 'border-gray-200 hover:border-indigo-300 text-gray-700'
                                    }`}
                            >
                                <div className="font-medium">{lab.name}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin size={14} />
                                    {lab.building}, Floor {lab.floor}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Station Grid */}
                {selectedLab && (
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {selectedLab.name} - Workstations
                            </h3>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-500"></div>
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-yellow-100 border-2 border-yellow-500"></div>
                                    <span>Reserved</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-100 border-2 border-red-500"></div>
                                    <span>Occupied</span>
                                </div>
                            </div>
                        </div>

                        {stations.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No stations available in this lab</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {stations.map(station => (
                                    <div
                                        key={station.id}
                                        onClick={() => openReservationModal(station)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${STATION_STATUS_COLORS[station.status]
                                            } ${station.status === 'available' ? 'hover:scale-105' : 'cursor-not-allowed opacity-75'}`}
                                    >
                                        <div className="flex items-center justify-center mb-2">
                                            <Monitor size={32} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg">#{station.stationNumber}</div>
                                            <div className="text-xs mt-1">{STATION_STATUS_LABELS[station.status]}</div>
                                            {station.currentReservation && (
                                                <div className="text-xs mt-2 opacity-75">
                                                    Until {formatTime(station.currentReservation.endTime)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Reservation Modal */}
            {isModalOpen && selectedStation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeModal}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-900">
                                Reserve Station #{selectedStation.stationNumber}
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

                            <div className="bg-gray-50 p-4 rounded-lg mb-4">
                                <div className="flex items-center gap-2 text-gray-600 mb-2">
                                    <MapPin size={18} />
                                    <span>{selectedLab?.name} - {selectedLab?.building}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Monitor size={18} />
                                    <span>Station #{selectedStation.stationNumber}</span>
                                </div>
                                {selectedStation.equipment?.length > 0 && (
                                    <div className="mt-2 text-sm text-gray-500">
                                        Equipment: {selectedStation.equipment.join(', ')}
                                    </div>
                                )}
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                <p className="text-yellow-800 text-sm">
                                    <strong>Note:</strong> Maximum reservation duration is {MAX_RESERVATION_HOURS} hours.
                                    You can only have one active reservation at a time.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                        min={getLocalDateString()}
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
                                        Purpose
                                    </label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Lab assignment, Group project"
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
                                        placeholder="Any additional notes..."
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
                                        {submitting ? 'Reserving...' : 'Reserve Station'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LabStationBookingPage;

