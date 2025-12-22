import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { labStationService, labReservationService } from '../services/labStationService';
import { MapPin, Monitor, AlertCircle, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

const LAB_STATUS = {
    AVAILABLE: 1,
    RESERVED: 2,
    OCCUPIED: 3,
    OUT_OF_SERVICE: 4
};

const STATION_STATUS_COLORS: Record<number, string> = {
    [LAB_STATUS.AVAILABLE]: 'bg-green-100 border-green-500 text-green-800',
    [LAB_STATUS.RESERVED]: 'bg-yellow-100 border-yellow-500 text-yellow-800',
    [LAB_STATUS.OCCUPIED]: 'bg-red-100 border-red-500 text-red-800',
    [LAB_STATUS.OUT_OF_SERVICE]: 'bg-gray-100 border-gray-500 text-gray-500'
};

const STATION_STATUS_LABELS: Record<number, string> = {
    [LAB_STATUS.AVAILABLE]: 'Available',
    [LAB_STATUS.RESERVED]: 'Reserved',
    [LAB_STATUS.OCCUPIED]: 'Occupied',
    [LAB_STATUS.OUT_OF_SERVICE]: 'Out of Service'
};

const MAX_RESERVATION_HOURS = 4;

const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function LabStationBookingPage() {
    useNavigate();
    // State
    const [labs, setLabs] = useState<any[]>([]);
    const [selectedLab, setSelectedLab] = useState<any>(null);
    const [stations, setStations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeReservation, setActiveReservation] = useState<any>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState<any>(null);
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
    const [expirationAlert, setExpirationAlert] = useState<any>(null);

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

    const fetchStations = async (labId: number) => {
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

    const formatTime = (date: string | Date) => {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const openReservationModal = (station: any) => {
        if (activeReservation) {
            setFormError('You already have an active reservation. Please complete or cancel it first.');
            return;
        }
        if (station.status !== LAB_STATUS.AVAILABLE) {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
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

            const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
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
        } catch (err: any) {
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
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to cancel reservation');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-muted-foreground">Loading labs...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">


            <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground">Lab Station Reservation</h2>
                    <p className="text-muted-foreground mt-2">Reserve a workstation for your study sessions</p>
                </div>

                {/* Expiration Alert */}
                {expirationAlert && (
                    <Alert variant="warning" className="mb-6 bg-orange-100 border-orange-500 text-orange-900">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Your reservation is expiring soon!</AlertTitle>
                        <AlertDescription>
                            Station {expirationAlert.station?.stationNumber} at {expirationAlert.station?.lab?.name}
                            expires at {formatTime(expirationAlert.endTime)}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Active Reservation Banner */}
                {activeReservation && (
                    <Card className="mb-6 border-primary/20 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-3 rounded-full">
                                        <Monitor className="text-primary" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-foreground">Active Reservation</h3>
                                        <p className="text-primary font-medium text-sm">
                                            Station {activeReservation.station?.stationNumber} at {activeReservation.station?.lab?.name}
                                        </p>
                                        <p className="text-muted-foreground text-sm">
                                            {formatDate(activeReservation.startTime)} • {formatTime(activeReservation.startTime)} - {formatTime(activeReservation.endTime)}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={handleCancelReservation}
                                    size="sm"
                                >
                                    Cancel Reservation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                {/* Lab Selection */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">Select Lab Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            {labs.map(lab => (
                                <button
                                    key={lab.id}
                                    onClick={() => setSelectedLab(lab)}
                                    className={cn(
                                        "px-4 py-3 rounded-lg border-2 transition-all text-left group",
                                        selectedLab?.id === lab.id
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-muted hover:border-primary/50 text-foreground'
                                    )}
                                >
                                    <div className="font-medium group-hover:text-primary transition-colors">{lab.name}</div>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin size={14} />
                                        {lab.building}, Floor {lab.floor}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Station Grid */}
                {selectedLab && (
                    <Card>
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">
                                    {selectedLab.name} - Workstations
                                </CardTitle>
                                <div className="flex items-center gap-4 text-xs sm:text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                        <span>Available</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                        <span>Reserved</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                        <span>Occupied</span>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {stations.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Monitor size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>No stations available in this lab</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {stations.map(station => (
                                        <div
                                            key={station.id}
                                            onClick={() => openReservationModal(station)}
                                            className={cn(
                                                "p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center min-h-[120px]",
                                                STATION_STATUS_COLORS[station.status],
                                                station.status === LAB_STATUS.AVAILABLE ? 'hover:scale-105' : 'cursor-not-allowed opacity-75'
                                            )}
                                        >
                                            <Monitor size={32} className="mb-2" />
                                            <div className="font-bold text-lg">#{station.stationNumber}</div>
                                            <div className="text-xs font-semibold uppercase mt-1 opacity-80">{STATION_STATUS_LABELS[station.status]}</div>
                                            {station.currentReservation && (
                                                <div className="text-[10px] mt-1 opacity-75 truncate w-full text-center">
                                                    Until {formatTime(station.currentReservation.endTime)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Reservation Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Reserve Station #{selectedStation?.stationNumber}</DialogTitle>
                        <DialogDescription>
                            Complete the form below to reserve this workstation.
                        </DialogDescription>
                    </DialogHeader>

                    {successMessage && (
                        <div className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
                            <Check size={16} />
                            {successMessage}
                        </div>
                    )}

                    {formError && (
                        <div className="flex items-center gap-2 bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-4 text-sm">
                            <AlertCircle size={16} />
                            {formError}
                        </div>
                    )}

                    <div className="bg-muted p-4 rounded-lg mb-4 text-sm">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={16} className="text-muted-foreground" />
                            <span>{selectedLab?.name} - {selectedLab?.building}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Monitor size={16} className="text-muted-foreground" />
                            <span>Station #{selectedStation?.stationNumber}</span>
                        </div>
                        {selectedStation?.equipment?.length > 0 && (
                            <div className="mt-2 text-muted-foreground pl-6">
                                Equipment: {selectedStation.equipment.join(', ')}
                            </div>
                        )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-yellow-800 text-xs">
                            <strong>Note:</strong> Maximum reservation duration is {MAX_RESERVATION_HOURS} hours.
                            You can only have one active reservation at a time.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date *</Label>
                            <Input
                                id="date"
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleInputChange}
                                required
                                min={getLocalDateString()}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time *</Label>
                                <Input
                                    id="startTime"
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time *</Label>
                                <Input
                                    id="endTime"
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose</Label>
                            <Input
                                id="purpose"
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleInputChange}
                                placeholder="e.g., Lab assignment, Group project"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="Any additional notes..."
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Reserving...' : 'Reserve Station'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
