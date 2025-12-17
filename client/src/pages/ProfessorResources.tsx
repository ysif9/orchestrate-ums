import { useState, useEffect } from 'react';
import { resourceService } from '../services/resourceService.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, AlertCircle, Loader2, CheckCircle, Calendar } from 'lucide-react';

export default function ProfessorResources() {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await resourceService.getMyAllocations();
                setAllocations(data);
            } catch (err) {
                console.error(err);
                setError('Failed to load your resources');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading resources...
            </div>
        );
    }

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString() : '—';

    return (
        <div className="min-h-screen p-8 bg-muted/20">
            <div className="max-w-5xl mx-auto space-y-8">

                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Package className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My Allocated Resources</h1>
                        <p className="text-muted-foreground">View equipment and software assigned to you</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                {allocations.length === 0 ? (
                    <Card className="text-center py-16">
                        <CardContent>
                            <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
                            <h3 className="text-lg font-semibold text-foreground mb-2">No Resources Allocated</h3>
                            <p className="text-muted-foreground">You don't have any resources allocated to you currently.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6">
                        {allocations.map((alloc) => (
                            <Card key={alloc.id} className="overflow-hidden">
                                <CardHeader className="pb-3 bg-muted/40">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <CardTitle>{alloc.resource?.name}</CardTitle>
                                                <Badge variant="outline" className="text-xs font-normal bg-background/50">
                                                    {alloc.resource?.type?.replace('_', ' ')}
                                                </Badge>
                                            </div>
                                            <CardDescription className="mt-1">
                                                {alloc.resource?.description || 'No description available'}
                                            </CardDescription>
                                        </div>
                                        <Badge className="bg-green-600 hover:bg-green-700 flex gap-1">
                                            <CheckCircle className="w-3 h-3" /> Active
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span>Allocated: <span className="text-foreground font-medium">{formatDate(alloc.allocatedAt)}</span></span>
                                        </div>
                                        {alloc.dueDate && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4 text-amber-500" />
                                                <span>Due: <span className="text-foreground font-medium">{formatDate(alloc.dueDate)}</span></span>
                                            </div>
                                        )}
                                    </div>

                                    {alloc.resource?.attributes?.length > 0 && (
                                        <div className="border-t pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4">
                                            <h4 className="text-sm font-semibold mb-2">Specifications</h4>
                                            <div className="space-y-1">
                                                {alloc.resource.attributes.map((a: any, i: number) => (
                                                    <div key={i} className="text-sm flex justify-between">
                                                        <span className="text-muted-foreground">{a.attribute?.label || a.attribute?.key}:</span>
                                                        <span className="font-medium text-right">
                                                            {a.stringValue ?? (a.numberValue !== undefined ? a.numberValue : (a.dateValue ? new Date(a.dateValue).toLocaleDateString() : (a.booleanValue !== undefined ? (a.booleanValue ? 'Yes' : 'No') : '—')))}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
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
}
