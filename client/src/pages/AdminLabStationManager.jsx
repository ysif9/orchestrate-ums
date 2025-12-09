import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomService } from '../services/bookingService.js';
import { labStationService } from '../services/labStationService.js';
import { Monitor, Plus, Edit2, Trash2, X, Check, AlertCircle } from 'lucide-react';

const STATION_STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'out_of_service', label: 'Out of Service' }
];

const STATION_STATUS_COLORS = {
    available: 'bg-green-100 text-green-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    occupied: 'bg-red-100 text-red-800',
    out_of_service: 'bg-gray-100 text-gray-500'
};

const STATION_STATUS_LABELS = {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    out_of_service: 'Out of Service'
};

const AdminLabStationManager = () => {
    const navigate = useNavigate();
    const { labId } = useParams();

    // State
    const [lab, setLab] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStation, setCurrentStation] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const initialFormState = {
        stationNumber: '',
        description: '',
        equipment: '',
        status: 'available',
        isActive: true
    };
    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchLabAndStations();
    }, [labId]);

    // Clear success message after 3 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const fetchLabAndStations = async () => {
        try {
            setLoading(true);
            setError('');

            // Fetch lab details
            const labResponse = await roomService.getById(labId);
            if (!labResponse.room || labResponse.room.type !== 'lab') {
                setError('This room is not a lab');
                return;
            }
            setLab(labResponse.room);

            // Fetch stations for this lab
            const stationsResponse = await labStationService.getStationsByLab(labId);
            setStations(stationsResponse.stations || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load lab data');
            console.error('Failed to fetch lab data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (station = null) => {
        if (station) {
            setCurrentStation(station);
            setFormData({
                stationNumber: station.stationNumber || '',
                description: station.description || '',
                equipment: Array.isArray(station.equipment) ? station.equipment.join(', ') : '',
                status: station.status || 'available',
                isActive: station.isActive !== false
            });
        } else {
            setCurrentStation(null);
            setFormData(initialFormState);
        }
        setError('');
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentStation(null);
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

        // Parse equipment from comma-separated string to array
        const equipmentArray = formData.equipment
            .split(',')
            .map(e => e.trim())
            .filter(e => e.length > 0);

        const payload = {
            stationNumber: formData.stationNumber,
            labId: parseInt(labId),
            description: formData.description || undefined,
            equipment: equipmentArray.length > 0 ? equipmentArray : undefined,
            status: formData.status,
            isActive: formData.isActive
        };

        try {
            if (currentStation) {
                await labStationService.update(currentStation.id, payload);
                setSuccessMessage('Station updated successfully');
            } else {
                await labStationService.create(payload);
                setSuccessMessage('Station created successfully');
            }
            await fetchLabAndStations();
            handleCloseModal();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to deactivate this station? It will no longer be available for reservations.')) {
            try {
                await labStationService.delete(id);
                setSuccessMessage('Station deactivated successfully');
                fetchLabAndStations();
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to deactivate station');
                console.error('Delete failed', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-content">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Success Message */}
                {successMessage && (
                    <div className="bg-success-100 text-success-700 px-4 py-3 rounded-lg mb-4 text-sm border border-success-200 flex items-center gap-2">
                        <Check size={18} />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && !isModalOpen && (
                    <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm border border-error-200 flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center mb-8 gap-4">
                    <button
                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover"
                        onClick={() => navigate('/admin/rooms')}
                    >
                        ← Back to Rooms
                    </button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-content m-0">
                            Lab Station Management
                        </h1>
                        {lab && (
                            <p className="text-content-secondary mt-2">
                                {lab.name} • {lab.building}, Floor {lab.floor}
                            </p>
                        )}
                    </div>
                    <button
                        className="bg-brand-500 hover:bg-brand-600 text-content-inverse px-5 py-3 rounded-lg text-sm font-medium transition-all hover:-translate-y-0.5 whitespace-nowrap shadow-button hover:shadow-button-hover flex items-center gap-2"
                        onClick={() => handleOpenModal()}
                    >
                        <Plus size={18} />
                        Add Station
                    </button>
                </header>

                {/* Station Grid */}
                <div className="bg-surface rounded-lg shadow-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-content">
                            Workstations ({stations.length})
                        </h2>
                        <div className="flex items-center gap-4 text-sm">
                            {Object.entries(STATION_STATUS_LABELS).map(([key, label]) => (
                                <div key={key} className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${STATION_STATUS_COLORS[key].split(' ')[0]}`}></div>
                                    <span className="text-content-secondary">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {stations.length === 0 ? (
                        <div className="text-center py-12 text-content-secondary">
                            <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                            <p>No stations configured for this lab</p>
                            <p className="text-sm mt-2">Click "Add Station" to create workstations</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                            {stations.map(station => (
                                <div
                                    key={station.id}
                                    className={`relative p-4 rounded-lg border-2 transition-all ${
                                        station.isActive !== false
                                            ? STATION_STATUS_COLORS[station.status]?.replace('text-', 'border-').replace('bg-', 'bg-') || 'bg-gray-100 border-gray-300'
                                            : 'bg-gray-50 border-gray-200 opacity-60'
                                    }`}
                                >
                                    {/* Action buttons */}
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={() => handleOpenModal(station)}
                                            className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                                            title="Edit"
                                        >
                                            <Edit2 size={14} className="text-gray-600" />
                                        </button>
                                        {station.isActive !== false && (
                                            <button
                                                onClick={() => handleDelete(station.id)}
                                                className="p-1.5 bg-white/80 hover:bg-white rounded-md transition-colors"
                                                title="Deactivate"
                                            >
                                                <Trash2 size={14} className="text-red-600" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-center mb-3 pt-4">
                                        <Monitor size={32} />
                                    </div>
                                    <div className="text-center">
                                        <div className="font-bold text-lg">#{station.stationNumber}</div>
                                        <div className="text-xs mt-1">
                                            {station.isActive !== false
                                                ? STATION_STATUS_LABELS[station.status] || station.status
                                                : 'Inactive'}
                                        </div>
                                        {station.equipment?.length > 0 && (
                                            <div className="text-xs mt-2 opacity-75 truncate" title={station.equipment.join(', ')}>
                                                {station.equipment.slice(0, 2).join(', ')}
                                                {station.equipment.length > 2 && '...'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
                    <div className="bg-surface rounded-lg shadow-modal max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6 border-b border-border pb-4 px-6 pt-6">
                            <h2 className="text-xl font-semibold m-0 text-content">
                                {currentStation ? 'Edit Station' : 'Add New Station'}
                            </h2>
                            <button
                                className="w-8 h-8 flex items-center justify-center bg-surface-tertiary hover:bg-surface-hover text-content-secondary rounded transition-colors"
                                onClick={handleCloseModal}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="px-6 pb-6">
                            {error && (
                                <div className="bg-error-100 text-error-700 px-4 py-3 rounded-lg mb-4 text-sm border border-error-200 flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Station Number *</label>
                                    <input
                                        className="px-3 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="stationNumber"
                                        value={formData.stationNumber}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 1, A1, WS-01"
                                        required
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Description</label>
                                    <textarea
                                        className="px-3 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 min-h-[80px] resize-y"
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Optional description of this workstation..."
                                    />
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Equipment</label>
                                    <input
                                        className="px-3 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="equipment"
                                        value={formData.equipment}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Oscilloscope, Multimeter, Soldering Iron"
                                    />
                                    <p className="text-xs text-content-tertiary mt-1">Enter equipment separated by commas</p>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Status *</label>
                                    <select
                                        className="px-3 py-2.5 border border-border rounded-md text-sm text-content bg-surface transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        {STATION_STATUS_OPTIONS.map(option => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <label className="text-sm font-medium mb-2 text-content">Active Status</label>
                                    <div className="flex items-center">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                name="isActive"
                                                checked={formData.isActive}
                                                onChange={handleInputChange}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                                            <span className="ml-3 text-sm text-content">
                                                {formData.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </label>
                                    </div>
                                    <p className="text-xs text-content-tertiary mt-1">Inactive stations cannot be reserved</p>
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
                                    {submitting ? 'Saving...' : (currentStation ? 'Save Changes' : 'Create Station')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLabStationManager;

