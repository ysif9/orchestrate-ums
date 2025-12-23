import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift, Shield, DollarSign, BookOpen, Clock, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';

interface Benefit {
    id: number;
    name: string;
    category?: string;
    description?: string;
    value?: string;
}

const BenefitsPage = () => {
    const navigate = useNavigate();
    const [benefits, setBenefits] = useState<Benefit[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const fetchBenefits = async () => {
            try {
                const user = authService.getCurrentUser() as any;
                setUserRole(user?.role || '');

                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/benefits', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setBenefits(response.data);
            } catch (error) {
                console.error('Failed to fetch benefits', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBenefits();
    }, []);

    const handleBack = () => {
        if (userRole === 'teaching_assistant') {
            navigate('/ta-dashboard');
        } else if (userRole === 'student') {
            navigate('/home');
        } else {
            navigate('/admin/home');
        }
    };

    const getIconForCategory = (category: string = '') => {
        const cat = category.toLowerCase();
        if (cat.includes('health') || cat.includes('medical')) return <Heart className="h-6 w-6 text-pink-500" />;
        if (cat.includes('finance') || cat.includes('money') || cat.includes('pay')) return <DollarSign className="h-6 w-6 text-green-500" />;
        if (cat.includes('education') || cat.includes('academic')) return <BookOpen className="h-6 w-6 text-blue-500" />;
        if (cat.includes('time') || cat.includes('leave')) return <Clock className="h-6 w-6 text-orange-500" />;
        return <Gift className="h-6 w-6 text-purple-500" />;
    };

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="mb-6 hover:bg-accent"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-primary" />
                        Employment Benefits
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        View your assigned benefits, compensations, and entitlements.
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-12">Loading benefits...</div>
                ) : benefits.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {benefits.map((benefit) => (
                            <Card key={benefit.id} className="hover:shadow-md transition-shadow cursor-default">
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-muted rounded-lg">
                                            {getIconForCategory(benefit.category)}
                                        </div>
                                        {benefit.value && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                {benefit.value}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-xl mb-1">{benefit.name}</h3>
                                    {benefit.category && (
                                        <p className="text-sm text-primary mb-2 font-medium">{benefit.category}</p>
                                    )}
                                    <p className="text-muted-foreground text-sm">
                                        {benefit.description || "No description available."}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="p-12 text-center">
                            <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium text-foreground mb-1">No benefits available</h3>
                            <p className="text-muted-foreground">It seems there are no benefits assigned to your profile yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default BenefitsPage;
