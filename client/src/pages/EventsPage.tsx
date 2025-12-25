import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventService } from '@/services/eventService';
import { ArrowLeft, Calendar, MapPin, Clock, Star, Users, Archive } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Event {
    id: number;
    title: string;
    description: string;
    organizer?: {
        id: number;
        name: string;
        email: string;
    };
    status: number;
    statusName: string;
    priority: number;
    priorityName: string;
    audience: number;
    audienceName: string;
    startDate: string;
    endDate: string;
    location?: string | null;
    publishedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

function EventsPage() {
    const navigate = useNavigate();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventService.getEvents();
            if (response.success) {
                setEvents(response.data);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const now = new Date();

    // Separate upcoming and archived events
    const upcomingEvents = events
        .filter(e => new Date(e.endDate) >= now && (e.status === 1 || e.status === 2))
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    const archivedEvents = events
        .filter(e => new Date(e.endDate) < now || e.status === 3)
        .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (startDate: string, endDate: string) => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    };

    const getRelativeDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const eventDate = new Date(date);
        eventDate.setHours(0, 0, 0, 0);

        const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays < 7) return `In ${diffDays} days`;
        if (diffDays < 14) return 'Next week';
        return formatDate(dateString);
    };

    const getPriorityStyle = (priority: number) => {
        switch (priority) {
            case 3: return 'border-l-purple-500 bg-purple-50/50';
            case 2: return 'border-l-orange-500 bg-orange-50/50';
            case 1: return 'border-l-blue-500 bg-blue-50/50';
            default: return 'border-l-gray-300 bg-gray-50/50';
        }
    };

    return (
        <div className="min-h-screen relative">
            {/* University themed gradient background */}
            <div
                className="fixed inset-0 -z-10"
                style={{
                    background: `
                        linear-gradient(135deg, 
                            rgba(59, 130, 246, 0.1) 0%, 
                            rgba(16, 185, 129, 0.1) 25%,
                            rgba(139, 92, 246, 0.05) 50%,
                            rgba(59, 130, 246, 0.1) 75%,
                            rgba(16, 185, 129, 0.05) 100%
                        )
                    `,
                    backgroundSize: 'cover'
                }}
            />
            <div
                className="fixed inset-0 -z-10 opacity-30"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Header */}
            <nav className="bg-primary/95 backdrop-blur-sm text-primary-foreground px-8 py-4 shadow-lg sticky top-0 z-50">
                <div className="max-w-5xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(-1)}
                            className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-primary-foreground flex items-center gap-2">
                                <Calendar className="h-6 w-6" />
                                University Events
                            </h1>
                            <p className="text-primary-foreground/80 text-sm">Stay updated with campus activities</p>
                        </div>
                    </div>
                    {archivedEvents.length > 0 && (
                        <Button
                            variant="ghost"
                            onClick={() => setShowArchived(!showArchived)}
                            className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                            <Archive className="h-4 w-4 mr-2" />
                            {showArchived ? 'Hide Archived' : `View Archived (${archivedEvents.length})`}
                        </Button>
                    )}
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-8 py-8">
                {/* Stats Banner */}
                <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8 border border-white/50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">{upcomingEvents.length}</div>
                            <div className="text-sm text-muted-foreground">Upcoming Events</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-emerald-600">
                                {upcomingEvents.filter(e => {
                                    const days = Math.floor((new Date(e.startDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                                    return days <= 7 && days >= 0;
                                }).length}
                            </div>
                            <div className="text-sm text-muted-foreground">This Week</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-purple-600">
                                {upcomingEvents.filter(e => e.priority === 3).length}
                            </div>
                            <div className="text-sm text-muted-foreground">Featured</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold text-gray-500">{archivedEvents.length}</div>
                            <div className="text-sm text-muted-foreground">Past Events</div>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <Card className="border-red-200 bg-red-50/80 backdrop-blur-sm">
                        <CardContent className="p-8 text-center text-red-600">
                            {error}
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        {/* Upcoming Events Section */}
                        <div className="mb-10">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Upcoming Events
                            </h2>

                            {upcomingEvents.length === 0 ? (
                                <Card className="bg-white/80 backdrop-blur-sm border-white/50 shadow-lg">
                                    <CardContent className="p-12 text-center">
                                        <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                                        <h3 className="text-lg font-semibold mb-2">No Upcoming Events</h3>
                                        <p className="text-muted-foreground">Check back later for new events!</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {upcomingEvents.map((event) => (
                                        <Card
                                            key={event.id}
                                            className={`bg-white/90 backdrop-blur-sm border-l-4 shadow-lg hover:shadow-xl transition-all ${getPriorityStyle(event.priority)}`}
                                        >
                                            <CardContent className="p-6">
                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                    {/* Date Badge */}
                                                    <div className="flex-shrink-0 text-center bg-primary/10 rounded-lg p-4 min-w-[100px]">
                                                        <div className="text-sm font-medium text-primary uppercase">
                                                            {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                                                        </div>
                                                        <div className="text-3xl font-bold text-primary">
                                                            {new Date(event.startDate).getDate()}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {new Date(event.startDate).toLocaleDateString(undefined, { weekday: 'short' })}
                                                        </div>
                                                    </div>

                                                    {/* Event Details */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                            {event.priority === 3 && (
                                                                <Badge className="bg-purple-500 text-white">
                                                                    <Star className="h-3 w-3 mr-1" />
                                                                    Featured
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                                                                {getRelativeDate(event.startDate)}
                                                            </Badge>
                                                            <Badge variant="secondary">
                                                                <Users className="h-3 w-3 mr-1" />
                                                                {event.audienceName}
                                                            </Badge>
                                                        </div>

                                                        <h3 className="text-xl font-semibold mb-2 text-gray-800">{event.title}</h3>
                                                        <p className="text-muted-foreground mb-4">{event.description}</p>

                                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-4 w-4" />
                                                                {formatTime(event.startDate, event.endDate)}
                                                            </span>
                                                            {event.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-4 w-4" />
                                                                    {event.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Archived Events Section */}
                        {showArchived && archivedEvents.length > 0 && (
                            <div>
                                <h2 className="text-xl font-bold text-gray-600 mb-6 flex items-center gap-2">
                                    <Archive className="h-5 w-5" />
                                    Past Events
                                </h2>

                                <div className="space-y-3">
                                    {archivedEvents.map((event) => (
                                        <Card
                                            key={event.id}
                                            className="bg-white/60 backdrop-blur-sm border-l-4 border-l-gray-300 opacity-75 hover:opacity-100 transition-opacity"
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex-shrink-0 text-center bg-gray-100 rounded-lg p-3 min-w-[70px]">
                                                        <div className="text-xs font-medium text-gray-500 uppercase">
                                                            {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                                                        </div>
                                                        <div className="text-xl font-bold text-gray-500">
                                                            {new Date(event.startDate).getDate()}
                                                        </div>
                                                    </div>

                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-gray-600">{event.title}</h3>
                                                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {formatDate(event.startDate)}
                                                            </span>
                                                            {event.location && (
                                                                <span className="flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {event.location}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <Badge variant="outline" className="text-gray-500 border-gray-300">
                                                        Completed
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default EventsPage;
