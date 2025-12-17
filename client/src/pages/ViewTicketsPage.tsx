import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsService } from "../services/ticketsService";
import { authService } from "../services/authService";
import { AlertCircle, Check, X, Wrench, Building2, MapPin, Users, Clock, CheckCircle, PlayCircle, Eye, Ticket } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";

const ISSUE_TYPES = [
    { value: 'hardware', label: 'Hardware' },
    { value: 'software', label: 'Software' },
    { value: 'other', label: 'Other' }
];

const TICKET_STATUS_COLORS: Record<string, string> = {
    open: 'bg-red-100 text-red-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800'
};

const TICKET_STATUS_LABELS: Record<string, string> = {
    open: 'Open',
    in_progress: 'In Progress',
    resolved: 'Resolved'
};

const ISSUE_TYPE_COLORS: Record<string, string> = {
    hardware: 'bg-red-100 text-red-800',
    software: 'bg-blue-100 text-blue-800',
    other: 'bg-gray-100 text-gray-800'
};

const ISSUE_TYPE_LABELS: Record<string, string> = {
    hardware: 'Hardware',
    software: 'Software',
    other: 'Other'
};

export default function ViewTicketsPage() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    // State
    const [rooms, setRooms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [myTickets, setMyTickets] = useState<any[]>([]);
    const [ticketsLoading, setTicketsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('create');

    // Details modal state
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [detailsTicket, setDetailsTicket] = useState<any>(null);

    // Create Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<any>(null);
    const [formData, setFormData] = useState({
        issue_type: 'other',
        description: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchRooms();
    }, []);

    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    useEffect(() => {
        if (activeTab === 'myTickets') {
            fetchMyTickets();
        }
    }, [activeTab]);

    const fetchRooms = async () => {
        try {
            setLoading(true);
            const response = await ticketsService.getRooms();
            setRooms(response);
        } catch (err) {
            setError('Failed to load rooms');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTickets = async () => {
        try {
            setTicketsLoading(true);
            const response = await ticketsService.getUserTickets();
            setMyTickets(response.tickets || response || []);
        } catch (err) {
            setError('Failed to load your tickets');
            console.error(err);
        } finally {
            setTicketsLoading(false);
        }
    };

    const handleOpenDetailsModal = (ticket: any) => {
        setDetailsTicket(ticket);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setDetailsTicket(null);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'open':
                return <AlertCircle size={16} />;
            case 'in_progress':
                return <PlayCircle size={16} />;
            case 'resolved':
                return <CheckCircle size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    const openTicketModal = (room: any) => {
        setSelectedRoom(room);
        setFormData({
            issue_type: 'other',
            description: ''
        });
        setFormError('');
        setSuccessMessage('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedRoom(null);
        setFormError('');
        setSuccessMessage('');
    };

    const handleIssueTypeChange = (value: string) => {
        setFormData(prev => ({ ...prev, issue_type: value }));
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, description: e.target.value }));
    };

    const handleSubmit = async () => {
        setFormError('');
        setSuccessMessage('');
        setSubmitting(true);

        if (!formData.description || formData.description.trim().length === 0) {
            setFormError('Please provide a description of the issue');
            setSubmitting(false);
            return;
        }

        try {
            const ticketData = {
                roomId: selectedRoom.id,
                issue_type: formData.issue_type,
                description: formData.description.trim()
            };

            await ticketsService.createTicket(ticketData);

            setSuccessMessage('Maintenance ticket submitted successfully!');

            setTimeout(() => {
                closeModal();
            }, 1500);
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Failed to submit ticket');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleBackToDashboard = () => {
        if (user?.role === 'student') {
            navigate('/home');
        } else {
            navigate('/admin/home');
        }
    };

    const filteredRooms = rooms.filter(room => {
        const searchLower = searchTerm.toLowerCase();
        return (
            room.name?.toLowerCase().includes(searchLower) ||
            room.building?.toLowerCase().includes(searchLower) ||
            room.type?.toLowerCase().includes(searchLower)
        );
    });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-muted-foreground">
                Loading rooms...
            </div>
        );
    }

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
                            onClick={handleBackToDashboard}
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
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-foreground">Maintenance Tickets</h2>
                    <p className="text-muted-foreground mt-1">Report issues or view your submitted tickets</p>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="create" className="flex items-center gap-2">
                            <Wrench size={16} />
                            Report Issue
                        </TabsTrigger>
                        <TabsTrigger value="myTickets" className="flex items-center gap-2">
                            <Ticket size={16} />
                            My Tickets
                        </TabsTrigger>
                    </TabsList>

                    {successMessage && !isModalOpen && (
                        <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
                            <Check className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <TabsContent value="create" className="space-y-6">
                        {/* Search Bar */}
                        <div className="bg-card rounded-lg shadow-sm border p-6">
                            <Input
                                type="text"
                                placeholder="Search rooms by name, building, or type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>

                        {/* Rooms Grid */}
                        <div className="bg-card rounded-lg shadow-sm border p-6">
                            <h3 className="text-lg font-semibold mb-6">Available Rooms</h3>

                            {filteredRooms.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Building2 size={48} className="mx-auto mb-4 opacity-50" />
                                    <p>{searchTerm ? 'No rooms match your search' : 'No rooms available'}</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredRooms.map(room => (
                                        <Card
                                            key={room.id}
                                            onClick={() => openTicketModal(room)}
                                            className="cursor-pointer transition-all hover:border-primary hover:shadow-md hover:scale-[1.02]"
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-lg">{room.name}</h4>
                                                        <Badge variant="secondary" className="mt-1">
                                                            {room.type}
                                                        </Badge>
                                                    </div>
                                                    <Wrench className="text-primary" size={24} />
                                                </div>

                                                <div className="space-y-2 text-sm text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 size={16} />
                                                        <span>{room.building}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={16} />
                                                        <span>Floor {room.floor}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users size={16} />
                                                        <span>Capacity: {room.capacity}</span>
                                                    </div>
                                                </div>

                                                {room.description && (
                                                    <p className="mt-3 text-xs text-muted-foreground/80 line-clamp-2">
                                                        {room.description}
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="myTickets">
                        <Card>
                            <CardContent className="p-0">
                                {ticketsLoading ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Loading your tickets...
                                    </div>
                                ) : myTickets.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Ticket size={48} className="mx-auto mb-4 opacity-50" />
                                        <p>You haven't submitted any tickets yet</p>
                                        <Button
                                            onClick={() => setActiveTab('create')}
                                            variant="link"
                                            className="mt-2"
                                        >
                                            Report Your First Issue
                                        </Button>
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Room</TableHead>
                                                <TableHead>Issue Type</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Created</TableHead>
                                                <TableHead className="text-center">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {myTickets.map(ticket => (
                                                <TableRow key={ticket.id}>
                                                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{ticket.room?.name}</div>
                                                            <div className="text-xs text-muted-foreground">{ticket.room?.building}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={ISSUE_TYPE_COLORS[ticket.issue_type]}>
                                                            {ISSUE_TYPE_LABELS[ticket.issue_type]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="max-w-[200px] truncate" title={ticket.description}>
                                                            {ticket.description}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={cn("gap-1", TICKET_STATUS_COLORS[ticket.status])}>
                                                            {getStatusIcon(ticket.status)}
                                                            {TICKET_STATUS_LABELS[ticket.status]}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                                        {formatDate(ticket.created_by)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleOpenDetailsModal(ticket)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Create Ticket Modal */}
            <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Report Maintenance Issue</DialogTitle>
                        <DialogDescription>
                            Submit a ticket for room maintenance.
                        </DialogDescription>
                    </DialogHeader>

                    {successMessage && (
                        <Alert variant="success" className="bg-green-50 border-green-200 text-green-800">
                            <Check className="h-4 w-4" />
                            <AlertTitle>Success</AlertTitle>
                            <AlertDescription>{successMessage}</AlertDescription>
                        </Alert>
                    )}

                    {formError && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}

                    {selectedRoom && (
                        <div className="bg-muted p-4 rounded-lg text-sm mb-4">
                            <h4 className="font-semibold mb-2">{selectedRoom.name}</h4>
                            <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} /> <span>{selectedRoom.building}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} /> <span>Floor {selectedRoom.floor}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="issue_type">Issue Type *</Label>
                            <Select
                                value={formData.issue_type}
                                onValueChange={handleIssueTypeChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select issue type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ISSUE_TYPES.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={handleDescriptionChange}
                                rows={5}
                                placeholder="Describe the issue..."
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeModal} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Ticket'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Ticket Details</DialogTitle>
                    </DialogHeader>
                    {detailsTicket && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Ticket ID</Label>
                                    <div className="font-medium">#{detailsTicket.id}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Status</Label>
                                    <div>
                                        <Badge variant="outline" className={cn("mt-1 gap-1", TICKET_STATUS_COLORS[detailsTicket.status])}>
                                            {getStatusIcon(detailsTicket.status)}
                                            {TICKET_STATUS_LABELS[detailsTicket.status]}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Issue Type</Label>
                                    <div>
                                        <Badge variant="outline" className={cn("mt-1", ISSUE_TYPE_COLORS[detailsTicket.issue_type])}>
                                            {ISSUE_TYPE_LABELS[detailsTicket.issue_type]}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Room</Label>
                                    <div className="font-medium">{detailsTicket.room?.name}</div>
                                    <div className="text-xs text-muted-foreground">{detailsTicket.room?.building}, Floor {detailsTicket.room?.floor}</div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-muted-foreground mb-1 block">Description</Label>
                                <div className="bg-muted p-3 rounded-md text-sm">
                                    {detailsTicket.description}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <Label className="text-muted-foreground">Created</Label>
                                    <div>{formatDate(detailsTicket.created_by)}</div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Resolved</Label>
                                    <div>
                                        {detailsTicket.resolved_at ? formatDate(detailsTicket.resolved_at) : 'Not yet resolved'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={handleCloseDetailsModal}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
