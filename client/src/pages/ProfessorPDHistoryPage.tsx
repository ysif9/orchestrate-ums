import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pdService } from '@/services/pdService';
import { authService } from '@/services/authService';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Calendar, Briefcase } from 'lucide-react'

const ProfessorPDHistoryPage = () => {
    const navigate = useNavigate();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const user: any = authService.getCurrentUser();

    useEffect(() => {
        if (user?.id) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const data = await pdService.getAllActivities(user.id);
            setActivities(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const totalHours = activities.reduce((sum, act) => sum + act.hours, 0);

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-4xl mx-auto space-y-6">

                <header className="flex justify-between items-center mb-6">
                    <div>
                        <Button variant="ghost" onClick={() => navigate('/admin/home')} className="mb-2 p-0 h-auto hover:bg-transparent hover:text-primary">
                            ← Back to Dashboard
                        </Button>
                        <h1 className="text-3xl font-bold tracking-tight">Professional Development History</h1>
                        <p className="text-muted-foreground">Review your recorded professional development activities.</p>
                    </div>
                    {/* Summary Card */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-full text-primary">
                                <Clock className="h-6 w-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                                <p className="text-2xl font-bold text-primary">{totalHours} hrs</p>
                            </div>
                        </CardContent>
                    </Card>
                </header>

                {loading ? (
                    <div className="text-center p-8">Loading history...</div>
                ) : activities.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center text-muted-foreground">
                            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No activities recorded yet.</p>
                            <p>Contact staff if you believe this is an error.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {activities.map(activity => (
                            <Card key={activity.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl mb-1">{activity.title}</CardTitle>
                                            <CardDescription>{activity.provider}</CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200">
                                            {activity.activityType}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex gap-6 text-sm text-muted-foreground mb-4">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            {new Date(activity.date).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            {activity.hours} Hours
                                        </div>
                                    </div>
                                    {activity.notes && (
                                        <div className="bg-muted/30 p-3 rounded-md text-sm">
                                            <p className="font-medium text-xs text-muted-foreground uppercase mb-1">Notes</p>
                                            {activity.notes}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfessorPDHistoryPage;
