import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomService } from '../services/bookingService.js';
import { labStationService } from '../services/labStationService.js';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Monitor, Plus, Edit2, Trash2, Check, AlertCircle } from 'lucide-react';

const STATION_STATUS_OPTIONS = [
    { value: 'available', label: 'Available' },
    { value: 'reserved', label: 'Reserved' },
    { value: 'occupied', label: 'Occupied' },
    { value: 'out_of_service', label: 'Out of Service' }
];

const STATION_STATUS_LABELS: Record<string, string> = {
    available: 'Available',
    reserved: 'Reserved',
    occupied: 'Occupied',
    out_of_service: 'Out of Service'
};

const STATION_STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    available: 'default', // Using default (primary) for available or maybe something else? Let's generic 'secondary' for common
    reserved: 'secondary',
    occupied: 'destructive',
    out_of_service: 'outline'
};
// Custom colors often needed for status if semantic tokens aren't enough
const STATION_STATUS_CLASSES: Record<string, string> = {
    available: 'bg-green-100 text-green-800 hover:bg-green-200 border-green-200',
    reserved: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200',
    occupied: 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200',
    out_of_service: 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-gray-200'
};


const AdminLabStationManager = () => {
    const navigate = useNavigate();
    const { labId } = useParams();

    // State
    const [lab, setLab] = useState<any>(null);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStation, setCurrentStation] = useState<any>(null);
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
        if (labId) {
            fetchLabAndStations();
        }
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load lab data');
            console.error('Failed to fetch lab data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (station: any = null) => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        // Handle checkbox separately
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            isActive: checked
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
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
            labId: parseInt(labId!),
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
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to deactivate this station? It will no longer be available for reservations.')) {
            try {
                await labStationService.delete(id);
                setSuccessMessage('Station deactivated successfully');
                fetchLabAndStations();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to deactivate station');
                console.error('Delete failed', err);
            }
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                Loading...
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-md mb-4 text-sm border border-green-200 flex items-center gap-2">
                        <Check size={18} />
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && !isModalOpen && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md mb-4 text-sm flex items-center gap-2">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/rooms')}
                    >
                        ← Back to Rooms
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Lab Station Management
                        </h1>
                        {lab && (
                            <p className="text-muted-foreground mt-1">
                                {lab.name} • {lab.building}, Floor {lab.floor}
                            </p>
                        )}
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Station
                    </Button>
                </header>

                {/* Station Grid */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold">
                                Workstations ({stations.length})
                            </h2>
                            <div className="flex items-center gap-4 text-sm">
                                {Object.entries(STATION_STATUS_LABELS).map(([key, label]) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${key === 'available' ? 'bg-green-500' : key === 'reserved' ? 'bg-yellow-500' : key === 'occupied' ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                                        <span className="text-muted-foreground">{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {stations.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                                <p>No stations configured for this lab</p>
                                <p className="text-sm mt-2">Click "Add Station" to create workstations</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {stations.map(station => (
                                    <div
                                        key={station.id}
                                        className={`relative p-4 rounded-lg border transition-all hover:shadow-md ${station.isActive !== false
                                                ? STATION_STATUS_CLASSES[station.status]
                                                : 'bg-muted border-muted-foreground/20 opacity-60'
                                            }`}
                                    >
                                        {/* Action buttons */}
                                        <div className="absolute top-2 right-2 flex gap-1 z-10">
                                            <button
                                                onClick={() => handleOpenModal(station)}
                                                className="p-1.5 bg-background/80 hover:bg-background rounded-md transition-colors shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit2 size={14} className="text-muted-foreground" />
                                            </button>
                                            {station.isActive !== false && (
                                                <button
                                                    onClick={() => handleDelete(station.id)}
                                                    className="p-1.5 bg-background/80 hover:bg-background rounded-md transition-colors shadow-sm"
                                                    title="Deactivate"
                                                >
                                                    <Trash2 size={14} className="text-destructive" />
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center mb-3 pt-4">
                                            <Monitor size={32} strokeWidth={1.5} />
                                        </div>
                                        <div className="text-center">
                                            <div className="font-bold text-lg">#{station.stationNumber}</div>
                                            <div className="text-xs mt-1 font-medium">
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
                    </CardContent>
                </Card>
            </div>

            {/* Modal Form */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{currentStation ? 'Edit Station' : 'Add New Station'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="stationNumber">Station Number *</Label>
                            <Input
                                id="stationNumber"
                                name="stationNumber"
                                value={formData.stationNumber}
                                onChange={handleInputChange}
                                placeholder="e.g. 1, A1, WS-01"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Optional description..."
                                className="min-h-[80px]"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="equipment">Equipment</Label>
                            <Input
                                id="equipment"
                                name="equipment"
                                value={formData.equipment}
                                onChange={handleInputChange}
                                placeholder="e.g. Oscilloscope, Multimeter"
                            />
                            <p className="text-xs text-muted-foreground">Comma-separated values</p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status *</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => handleSelectChange('status', value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATION_STATUS_OPTIONS.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={formData.isActive}
                                    onChange={(e) => handleCheckboxChange(e.target.checked)}
                                />
                                <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Inactive stations cannot be reserved</p>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : (currentStation ? 'Save Changes' : 'Create Station')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminLabStationManager;
