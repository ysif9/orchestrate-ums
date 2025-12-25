import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { announcementService } from '@/services/announcementService';
import { Megaphone, Clock, AlertTriangle, Star, Info } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: number;
    priorityName: string;
    publishedAt?: string | null;
    createdAt: string;
}

interface AnnouncementNotificationProps {
    variant?: 'light' | 'dark';
}

export function AnnouncementNotification({ variant = 'light' }: AnnouncementNotificationProps) {
    const navigate = useNavigate();
    const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
    const [hasNew, setHasNew] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showPreview, setShowPreview] = useState(false);
    const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Colors based on variant (dark = for dark/primary background headers)
    const iconColor = variant === 'dark' ? 'text-white' : 'text-primary';
    const hoverBg = variant === 'dark' ? 'hover:bg-white/20' : 'hover:bg-primary/10';

    useEffect(() => {
        fetchLatestAnnouncement();
    }, []);

    const fetchLatestAnnouncement = async () => {
        try {
            setLoading(true);
            const response = await announcementService.getAnnouncements();
            if (response.success && response.data.length > 0) {
                // Sort by publishedAt descending and get the first one
                const sorted = response.data.sort((a: Announcement, b: Announcement) => {
                    const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
                    const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(b.createdAt);
                    return dateB.getTime() - dateA.getTime();
                });
                setLatestAnnouncement(sorted[0]);

                // Check if there are any announcements from the last 24 hours
                const oneDayAgo = new Date();
                oneDayAgo.setDate(oneDayAgo.getDate() - 1);
                const hasRecentAnnouncements = sorted.some((a: Announcement) => {
                    const date = a.publishedAt ? new Date(a.publishedAt) : new Date(a.createdAt);
                    return date > oneDayAgo;
                });
                setHasNew(hasRecentAnnouncements);
            }
        } catch (err) {
            console.error('Error fetching announcements:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPriorityIcon = (priority: number) => {
        switch (priority) {
            case 3: return <AlertTriangle className="h-3 w-3 text-red-500" />;
            case 2: return <Star className="h-3 w-3 text-orange-500" />;
            default: return <Info className="h-3 w-3 text-blue-500" />;
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const handleMouseEnter = () => {
        hoverTimeoutRef.current = setTimeout(() => {
            setShowPreview(true);
        }, 300);
    };

    const handleMouseLeave = () => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
        setShowPreview(false);
    };

    const handleClick = () => {
        setShowPreview(false);
        navigate('/news?tab=announcements');
    };

    if (loading) {
        return (
            <Button variant="ghost" size="icon" className={`relative ${hoverBg}`} disabled>
                <Megaphone size={18} className={variant === 'dark' ? 'text-white/50' : 'text-gray-400'} />
            </Button>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Button
                variant="ghost"
                size="icon"
                className={`relative ${hoverBg}`}
                onClick={handleClick}
            >
                <Megaphone size={18} className={iconColor} />
                {hasNew && (
                    <span className="absolute -top-0.5 -right-0.5 h-3 w-3 bg-red-500 rounded-full">
                        <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-75"></span>
                    </span>
                )}
            </Button>

            {/* Hover Preview Card */}
            {showPreview && (
                <div
                    className="absolute top-full right-0 mt-2 w-80 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
                    onClick={handleClick}
                >
                    {latestAnnouncement ? (
                        <div className="bg-white rounded-lg shadow-xl border cursor-pointer hover:shadow-2xl transition-shadow">
                            <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-2 border-b flex items-center justify-between rounded-t-lg">
                                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                                    <Megaphone className="h-3 w-3" />
                                    Latest Announcement
                                </span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimeAgo(latestAnnouncement.publishedAt || latestAnnouncement.createdAt)}
                                </span>
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    {getPriorityIcon(latestAnnouncement.priority)}
                                    <span className="text-xs font-medium text-muted-foreground">
                                        {latestAnnouncement.priorityName}
                                    </span>
                                    {hasNew && (
                                        <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full">
                                            New
                                        </span>
                                    )}
                                </div>
                                <p className="font-semibold text-sm text-gray-800 mb-2 line-clamp-2">
                                    {latestAnnouncement.title}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                    {latestAnnouncement.content}
                                </p>
                            </div>
                            <div className="bg-gray-50 px-4 py-2 border-t rounded-b-lg">
                                <span className="text-xs text-primary font-medium">
                                    Click to view all announcements →
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-xl border p-4 text-center">
                            <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">No announcements</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default AnnouncementNotification;
