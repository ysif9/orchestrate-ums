import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, Star } from 'lucide-react';
import { eventService } from '@/services/eventService';

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
    priority: number;
    priorityName: string;
    audience: number;
    startDate: string;
    endDate: string;
    location?: string | null;
    publishedAt?: string | null;
    createdAt: string;
}

interface EventsBannerProps {
    maxItems?: number;
    className?: string;
}

export function EventsBanner({ maxItems = 3, className = '' }: EventsBannerProps) {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await eventService.getEvents();
            if (response.success) {
                // Only show published/ongoing events, sorted by start date
                const upcomingEvents = response.data
                    .filter((e: Event) => e.status === 1 || e.status === 2) // Published or Ongoing
                    .sort((a: Event, b: Event) => {
                        // Sort by priority (featured first) then by start date
                        if (b.priority !== a.priority) return b.priority - a.priority;
                        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                    })
                    .slice(0, maxItems);
                setEvents(upcomingEvents);
            }
        } catch (err) {
            console.error('Error fetching events:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityStyles = (priority: number) => {
        switch (priority) {
            case 3: // Featured
                return {
                    border: 'border-l-purple-500',
                    badge: 'bg-purple-500 text-white',
                    icon: <Star className="h-4 w-4" />
                };
            case 2: // High
                return {
                    border: 'border-l-orange-500',
                    badge: 'bg-orange-500 text-white',
                    icon: null
                };
            default:
                return {
                    border: 'border-l-emerald-500',
                    badge: 'bg-emerald-500/10 text-emerald-600',
                    icon: null
                };
        }
    };

    const formatEventDate = (startDate: string, _endDate: string) => {
        const start = new Date(startDate);
        const now = new Date();

        const startStr = start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const timeStr = start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

        // Check if event is today
        const isToday = start.toDateString() === now.toDateString();
        if (isToday) {
            return `Today at ${timeStr}`;
        }

        // Check if event is tomorrow
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (start.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow at ${timeStr}`;
        }

        return `${startStr} at ${timeStr}`;
    };

    if (loading) {
        return (
            <Card className={className}>
                <CardContent className="p-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        Loading events...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (events.length === 0) {
        return null; // Don't show anything if there are no events
    }

    return (
        <Card className={`${className} overflow-hidden`}>
            <CardHeader className="pb-3 bg-gradient-to-r from-emerald-500/5 to-emerald-500/10">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-emerald-600" />
                    Upcoming Events
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {events.map((event) => {
                        const styles = getPriorityStyles(event.priority);
                        const isExpanded = expanded === event.id;

                        return (
                            <div
                                key={event.id}
                                className={`p-4 border-l-4 ${styles.border} hover:bg-muted/30 transition-colors cursor-pointer`}
                                onClick={() => setExpanded(isExpanded ? null : event.id)}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            {event.priority === 3 && (
                                                <Badge className={styles.badge}>
                                                    {styles.icon}
                                                    Featured
                                                </Badge>
                                            )}
                                            <h4 className="font-semibold text-sm truncate">{event.title}</h4>
                                        </div>
                                        <p className={`text-sm text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                                            {event.description}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatEventDate(event.startDate, event.endDate)}
                                            </span>
                                            {event.location && (
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {event.location}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

export default EventsBanner;
