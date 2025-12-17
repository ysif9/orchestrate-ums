import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { roomService, bookingService } from '../services/bookingService';
import { Calendar as CalendarIcon, Clock, MapPin, Users, ChevronLeft, ChevronRight, AlertCircle, Check, X } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROOM_TYPES: Record<string, string> = {
    classroom: 'Classroom',
    lab: 'Lab',
    lecture_hall: 'Lecture Hall',
    conference_room: 'Conference Room'
};

const ROOM_TYPE_COLORS: Record<string, string> = {
    classroom: 'bg-blue-100 text-blue-800',
    lab: 'bg-purple-100 text-purple-800',
    lecture_hall: 'bg-green-100 text-green-800',
    conference_room: 'bg-orange-100 text-orange-800'
};

export default function RoomBookingPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // State
    const [rooms, setRooms] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentWeekStart, setCurrentWeekStart] = useState(getWeekStart(new Date()));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view'>('create');
    const [selectedBooking, setSelectedBooking] = useState<any>(null);
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
    const buildings = Array.from(new Set(rooms.map(r => r.building)));

    // Filter rooms
    const filteredRooms = rooms.filter(room => {
        if (roomTypeFilter !== 'all' && room.type !== roomTypeFilter) return false;
        if (buildingFilter !== 'all' && room.building !== buildingFilter) return false;
        return true;
    });

    // Helper functions
    function getWeekStart(date: Date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function getWeekDays(weekStart: Date) {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(weekStart);
            day.setDate(weekStart.getDate() + i);
            days.push(day);
        }
        return days;
    }

    function formatDate(date: Date) {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }

    function formatTime(date: string | Date) {
        return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function isSameDay(date1: Date, date2: Date) {
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

    const fetchBookingsForRoom = async (roomId: number) => {
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
    const openCreateModal = (date: Date, hour = 9) => {
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

    const openViewModal = (booking: any) => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Client-side conflict check
    const checkClientSideConflict = (roomId: number, startTime: Date, endTime: Date) => {
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
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to create booking');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelBooking = async (bookingId: number) => {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;

        try {
            await bookingService.cancel(bookingId);
            fetchBookingsForRoom(selectedRoom.id);
            closeModal();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to cancel booking');
        }
    };

    // Get bookings for a specific day
    const getBookingsForDay = (date: Date) => {
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
                <div className="text-muted-foreground">Loading rooms...</div>
            </div>
        );
    }

    const weekDays = getWeekDays(currentWeekStart);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <nav className="bg-primary text-primary-foreground px-8 py-4 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-bold">
                        AIN SHAMS
                        <span className="block text-xs font-normal text-primary-foreground/80 tracking-wider mt-1">
                            UNIVERSITY | FACULTY OF ENGINEERING
                        </span>
                    </h1>
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/home')}
                            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        >
                            ← Back to Dashboard
                        </Button>
                        <span className="text-sm font-medium text-primary-foreground/80">
                            {user?.name}
                        </span>
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-8 py-8 w-full flex-1">
                {/* Page Title */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-foreground">Room Booking</h2>
                    <p className="text-muted-foreground mt-2">Book classrooms and labs for your lectures and sessions</p>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                        <AlertCircle size={20} />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Room List Sidebar */}
                    <Card className="lg:col-span-1 h-fit">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Available Rooms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Filters */}
                            <div className="space-y-3">
                                <Select value={roomTypeFilter} onValueChange={setRoomTypeFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        {Object.entries(ROOM_TYPES).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={buildingFilter} onValueChange={setBuildingFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Buildings" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Buildings</SelectItem>
                                        {buildings.map((b: any) => (
                                            <SelectItem key={b} value={b}>{b}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Room List */}
                            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                {filteredRooms.length === 0 ? (
                                    <p className="text-muted-foreground text-sm text-center py-4">No rooms available</p>
                                ) : (
                                    filteredRooms.map(room => (
                                        <div
                                            key={room.id}
                                            onClick={() => setSelectedRoom(room)}
                                            className={cn(
                                                "p-3 rounded-lg cursor-pointer transition-all border-2",
                                                selectedRoom?.id === room.id
                                                    ? 'bg-primary/5 border-primary'
                                                    : 'bg-background hover:bg-muted border-transparent'
                                            )}
                                        >
                                            <div className="font-medium text-foreground">{room.name}</div>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <MapPin size={14} />
                                                <span>{room.building}, Floor {room.floor}</span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-auto font-normal", ROOM_TYPE_COLORS[room.type]?.split(' ')[1])}>
                                                    {ROOM_TYPES[room.type]}
                                                </Badge>
                                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Users size={12} />
                                                    {room.capacity}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calendar View */}
                    <Card className="lg:col-span-3 overflow-hidden">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                                    <ChevronLeft size={18} />
                                </Button>
                                <Button variant="outline" size="icon" onClick={goToNextWeek}>
                                    <ChevronRight size={18} />
                                </Button>
                                <Button variant="ghost" onClick={goToToday}>
                                    Today
                                </Button>
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">
                                {currentWeekStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h3>
                            {selectedRoom && (
                                <div className="text-sm text-muted-foreground hidden sm:block">
                                    Viewing: <span className="font-medium text-foreground">{selectedRoom.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Calendar Grid */}
                        <div className="overflow-x-auto">
                            <div className="min-w-[800px]">
                                {/* Day Headers */}
                                <div className="grid grid-cols-8 border-b">
                                    <div className="p-3 text-center text-sm font-medium text-muted-foreground border-r bg-muted/20">
                                        Time
                                    </div>
                                    {weekDays.map((day, idx) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                "p-3 text-center border-r last:border-r-0",
                                                isSameDay(day, new Date()) ? 'bg-primary/5' : ''
                                            )}
                                        >
                                            <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                                {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                            </div>
                                            <div className={cn(
                                                "text-sm font-bold w-8 h-8 flex items-center justify-center mx-auto rounded-full",
                                                isSameDay(day, new Date())
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-foreground'
                                            )}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Time Slots */}
                                <div className="max-h-[600px] overflow-y-auto">
                                    {timeSlots.map(hour => (
                                        <div key={hour} className="grid grid-cols-8 border-b last:border-b-0 min-h-[60px]">
                                            <div className="p-2 text-center text-xs text-muted-foreground border-r bg-muted/20 flex items-center justify-center font-medium">
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
                                                        className={cn(
                                                            "p-1 border-r last:border-r-0 transition-colors relative",
                                                            isPast
                                                                ? 'bg-muted/50 cursor-not-allowed'
                                                                : isBooked && !isStartHour
                                                                    ? 'bg-primary/10 cursor-pointer hover:bg-primary/20'
                                                                    : isBooked
                                                                        ? 'cursor-pointer hover:bg-primary/20'
                                                                        : 'hover:bg-primary/5 cursor-pointer',
                                                            isSameDay(day, new Date()) && !isBooked ? 'bg-primary/5' : ''
                                                        )}
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
                                                            <div className="absolute inset-x-1 top-1 bottom-1 bg-primary text-primary-foreground text-xs p-1.5 rounded shadow-sm z-10 overflow-hidden flex flex-col">
                                                                <div className="font-semibold truncate">{slotBooking.title}</div>
                                                                <div className="text-[10px] opacity-90 truncate">
                                                                    {formatTime(slotBooking.startTime)} - {formatTime(slotBooking.endTime)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {isBooked && !isStartHour && (
                                                            <div className="absolute inset-x-1 top-0 bottom-1 bg-primary/20 rounded z-0"></div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Booking Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{modalMode === 'create' ? 'Book Room' : 'Booking Details'}</DialogTitle>
                        <DialogDescription>
                            {modalMode === 'create' ? 'Fill in the details to book the room.' : 'View details of the booking.'}
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

                    {modalMode === 'create' ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Booking Title *</Label>
                                <Input
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="e.g., CS101 Lecture"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="roomId">Room</Label>
                                <Select
                                    value={formData.roomId.toString()}
                                    onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Room" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {rooms.map(room => (
                                            <SelectItem key={room.id} value={room.id.toString()}>
                                                {room.name} - {room.building} ({ROOM_TYPES[room.type]})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleInputChange}
                                    required
                                    min={new Date().toISOString().split('T')[0]}
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
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={3}
                                    placeholder="Optional description..."
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
                                    placeholder="Any special requirements..."
                                />
                            </div>

                            <DialogFooter className="gap-2">
                                <Button type="button" variant="outline" onClick={closeModal} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? 'Booking...' : 'Book Room'}
                                </Button>
                            </DialogFooter>
                        </form>
                    ) : (
                        /* View Mode */
                        selectedBooking && (
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-semibold text-foreground">{selectedBooking.title}</h4>
                                    {selectedBooking.description && (
                                        <p className="text-muted-foreground mt-1 text-sm">{selectedBooking.description}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <CalendarIcon size={16} />
                                        <span>{new Date(selectedBooking.startTime).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock size={16} />
                                        <span>
                                            {formatTime(selectedBooking.startTime)} - {formatTime(selectedBooking.endTime)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 text-sm text-foreground p-2 border rounded-md">
                                    <MapPin size={16} className="text-muted-foreground" />
                                    <span>
                                        {selectedBooking.room?.name} - {selectedBooking.room?.building}
                                    </span>
                                </div>

                                <div className="text-sm text-muted-foreground">
                                    Booked by: <span className="font-medium text-foreground">{selectedBooking.bookedBy?.name}</span>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="bg-muted p-3 rounded-lg text-sm">
                                        <div className="font-medium text-foreground mb-1">Notes:</div>
                                        <div className="text-muted-foreground">{selectedBooking.notes}</div>
                                    </div>
                                )}

                                {/* Show cancel button only if user owns the booking */}
                                {selectedBooking.bookedBy?.id === user?.id && (
                                    <DialogFooter>
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleCancelBooking(selectedBooking.id)}
                                        >
                                            Cancel Booking
                                        </Button>
                                    </DialogFooter>
                                )}
                            </div>
                        )
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
