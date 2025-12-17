import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/bookingService.js';
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
import { Monitor, Trash2, Edit2, Plus, X } from 'lucide-react';

const ROOM_TYPES = [
    { value: 'classroom', label: 'Classroom' },
    { value: 'lab', label: 'Lab' },
    { value: 'lecture_hall', label: 'Lecture Hall' },
    { value: 'conference_room', label: 'Conference Room' }
];

const ROOM_TYPE_LABELS: Record<string, string> = {
    classroom: 'Classroom',
    lab: 'Lab',
    lecture_hall: 'Lecture Hall',
    conference_room: 'Conference Room'
};

const ROOM_TYPE_BADGE_COLOR: Record<string, string> = {
    classroom: 'bg-blue-100 text-blue-800 hover:bg-blue-100', // Using Tailwind classes on badge for custom colors
    lab: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
    lecture_hall: 'bg-green-100 text-green-800 hover:bg-green-100',
    conference_room: 'bg-orange-100 text-orange-800 hover:bg-orange-100'
};


const AdminRoomManager = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentRoom, setCurrentRoom] = useState<any>(null);
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

    const handleOpenModal = (room: any = null) => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
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
            isAvailable: checked
        }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
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
            floor: parseInt(formData.floor as any),
            capacity: parseInt(formData.capacity as any),
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
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
            try {
                await roomService.delete(id);
                setSuccessMessage('Room deleted successfully');
                fetchRooms();
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to delete room');
                console.error('Delete failed', err);
            }
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 text-green-700 px-4 py-3 rounded-md mb-4 text-sm border border-green-200">
                        {successMessage}
                    </div>
                )}

                {/* Header */}
                <header className="flex justify-between items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin/home')}
                    >
                        ← Back to Home
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
                        <p className="text-muted-foreground mt-1">Add, edit, and manage classrooms and labs</p>
                    </div>
                    <Button onClick={() => handleOpenModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Create Room
                    </Button>
                </header>

                {/* Data Table */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">Room Name</th>
                                        <th className="px-6 py-4 font-medium">Building</th>
                                        <th className="px-6 py-4 font-medium">Floor</th>
                                        <th className="px-6 py-4 font-medium">Type</th>
                                        <th className="px-6 py-4 font-medium">Capacity</th>
                                        <th className="px-6 py-4 font-medium">Amenities</th>
                                        <th className="px-6 py-4 font-medium">Status</th>
                                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {rooms.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                                No rooms found. Add one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        rooms.map(room => (
                                            <tr key={room.id} className="hover:bg-muted/50 transition-colors">
                                                <td className="px-6 py-4 font-semibold">{room.name}</td>
                                                <td className="px-6 py-4">{room.building}</td>
                                                <td className="px-6 py-4">{room.floor}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${ROOM_TYPE_BADGE_COLOR[room.type] || 'bg-gray-100 text-gray-800'}`}>
                                                        {ROOM_TYPE_LABELS[room.type] || room.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{room.capacity}</td>
                                                <td className="px-6 py-4 text-muted-foreground">
                                                    {Array.isArray(room.amenities) && room.amenities.length > 0
                                                        ? room.amenities.join(', ')
                                                        : 'None'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={room.isAvailable !== false ? 'default' : 'destructive'} className={room.isAvailable !== false ? "bg-green-600 hover:bg-green-700" : ""}>
                                                        {room.isAvailable !== false ? 'Available' : 'Unavailable'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 justify-end">
                                                        {room.type === 'lab' && (
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                className="h-8 gap-1.5"
                                                                onClick={() => navigate(`/admin/rooms/${room.id}/stations`)}
                                                                title="Manage Lab Stations"
                                                            >
                                                                <Monitor size={14} />
                                                                Stations
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                            onClick={() => handleOpenModal(room)}
                                                            title="Edit"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                            onClick={() => handleDelete(room.id)}
                                                            title="Delete"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Form */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{currentRoom ? 'Edit Room' : 'Create New Room'}</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        {error && (
                            <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Room Name *</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Room 101"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="building">Building *</Label>
                                <Input
                                    id="building"
                                    name="building"
                                    value={formData.building}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Engineering Building A"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="floor">Floor *</Label>
                                <Input
                                    id="floor"
                                    type="number"
                                    name="floor"
                                    value={formData.floor}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="capacity">Capacity *</Label>
                                <Input
                                    id="capacity"
                                    type="number"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleInputChange}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value) => handleSelectChange('type', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROOM_TYPES.map(type => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2 flex flex-col justify-end">
                                <div className="flex items-center space-x-2 pb-2">
                                    <input
                                        type="checkbox"
                                        id="isAvailable"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={formData.isAvailable}
                                        onChange={(e) => handleCheckboxChange(e.target.checked)}
                                    />
                                    <Label htmlFor="isAvailable" className="cursor-pointer">Available</Label>
                                </div>
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Optional room description..."
                                    className="min-h-[80px]"
                                />
                            </div>

                            <div className="space-y-2 col-span-2">
                                <Label htmlFor="amenities">Amenities</Label>
                                <Input
                                    id="amenities"
                                    name="amenities"
                                    value={formData.amenities}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Projector, Whiteboard, AC"
                                />
                                <p className="text-xs text-muted-foreground">Comma-separated values</p>
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={handleCloseModal} disabled={submitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving...' : (currentRoom ? 'Save Changes' : 'Create Room')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRoomManager;
