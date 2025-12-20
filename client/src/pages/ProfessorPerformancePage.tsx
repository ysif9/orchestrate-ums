import { useState, useEffect } from 'react';
import { evaluationService } from '../services/evaluationService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Calendar, UserCheck } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";

export default function ProfessorPerformancePage() {
    const navigate = useNavigate();
    const [evaluations, setEvaluations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvaluations();
    }, []);

    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            const data = await evaluationService.getMyEvaluations();
            setEvaluations(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/home')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-3xl font-bold">My Performance History</h1>
            </div>
            <p className="text-muted-foreground mb-8">View your historical performance evaluations and feedback.</p>

            {loading ? (
                <div className="text-center py-12">Loading evaluations...</div>
            ) : evaluations.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                        <UserCheck className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg">No performance evaluations have been recorded yet.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6">
                    {evaluations.map((evalItem) => (
                        <Card key={evalItem.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="bg-muted/30 border-b pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl flex items-center gap-2">
                                            <Calendar className="h-5 w-5 text-primary" />
                                            {new Date(evalItem.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            Evaluated by: {evalItem.evaluator?.name || 'Staff Member'}
                                        </CardDescription>
                                    </div>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-semibold">
                                        Evaluation ID: #{evalItem.id}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-background border rounded-xl p-4 text-center shadow-sm">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Teaching</div>
                                        <div className="text-3xl font-bold text-primary">{evalItem.ratings?.teaching || '-'}</div>
                                        <div className="text-xs text-muted-foreground mt-1">out of 5</div>
                                    </div>
                                    <div className="bg-background border rounded-xl p-4 text-center shadow-sm">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Research</div>
                                        <div className="text-3xl font-bold text-primary">{evalItem.ratings?.research || '-'}</div>
                                        <div className="text-xs text-muted-foreground mt-1">out of 5</div>
                                    </div>
                                    <div className="bg-background border rounded-xl p-4 text-center shadow-sm">
                                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Service</div>
                                        <div className="text-3xl font-bold text-primary">{evalItem.ratings?.service || '-'}</div>
                                        <div className="text-xs text-muted-foreground mt-1">out of 5</div>
                                    </div>
                                </div>

                                {evalItem.comments && (
                                    <div className="bg-muted/20 border rounded-lg p-5">
                                        <h4 className="font-semibold mb-2 text-sm text-foreground">Feedback & Comments</h4>
                                        <p className="text-muted-foreground leading-relaxed">"{evalItem.comments}"</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
