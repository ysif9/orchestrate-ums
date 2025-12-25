import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingDown, Building } from 'lucide-react';
import { authService } from '@/services/authService';

interface PayrollDetails {
    baseSalary: string;
    taxRate: string;
    insuranceAmount: string;
    otherDeductions: string;
    paymentFrequency: number;
    // Calculated fields could be done here or backend
}

// Using const object instead of enum for better compatibility
const PaymentFrequency = {
    Monthly: 0,
    Weekly: 1
} as const;

const StaffPayrollPage = () => {
    const navigate = useNavigate();
    const [payroll, setPayroll] = useState<PayrollDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const user: any = authService.getCurrentUser();
    const dashboardPath = user?.role === 'teaching_assistant' ? '/ta-dashboard' : '/admin/home';

    useEffect(() => {
        fetchPayrollDetails();
    }, []);

    const fetchPayrollDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/payroll/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setPayroll(response.data.data);
            }
        } catch (err: any) {
            console.error('Failed to fetch payroll:', err);
            setError(err.response?.data?.message || 'Failed to load payroll details');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading payroll information...</div>;
    }

    if (error) {
        return (
            <div className="p-8 flex justify-center">
                <Card className="max-w-md w-full border-red-200">
                    <CardContent className="p-6 text-center text-red-600">
                        <p>{error}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!payroll) {
        return <div className="p-8 text-center text-muted-foreground">No payroll information found.</div>;
    }

    // Calculations
    const baseSalary = parseFloat(payroll.baseSalary);
    const taxRate = parseFloat(payroll.taxRate);
    const insurance = parseFloat(payroll.insuranceAmount);
    const other = parseFloat(payroll.otherDeductions);

    const taxAmount = (baseSalary * taxRate) / 100;
    const totalDeductions = taxAmount + insurance + other;
    const netSalary = baseSalary - totalDeductions;

    // Fix TS indexing error by casting or using Map
    const frequencyMap: Record<number, string> = {
        0: 'Monthly',
        1: 'Weekly'
    };
    const frequencyLabel = frequencyMap[payroll.paymentFrequency] || 'Monthly';

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate(dashboardPath)}
                        className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
                    >
                        ← Back to Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold text-primary mb-2">My Payroll</h1>
                    <p className="text-muted-foreground">View your compensation details and deductions</p>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Base Salary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold flex items-center">
                                <span className="text-xl mr-1">EGP</span>
                                {baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <Badge variant="secondary" className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-100">
                                <Calendar className="w-3 h-3 mr-1" />
                                {frequencyLabel}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Net Pay</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-green-700 flex items-center">
                                <span className="text-xl mr-1">EGP</span>
                                {netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">After all deductions</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Deductions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-orange-700 flex items-center">
                                <span className="text-xl mr-1">EGP</span>
                                {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                {(totalDeductions / baseSalary * 100).toFixed(1)}% of base salary
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Deductions Breakdown */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="h-5 w-5 text-orange-500" />
                            Deductions Breakdown
                        </CardTitle>
                        <CardDescription>Detailed view of all applied deductions</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">%</div>
                                    <div>
                                        <p className="font-medium">Income Tax</p>
                                        <p className="text-xs text-muted-foreground">Calculated at {taxRate}%</p>
                                    </div>
                                </div>
                                <span className="font-mono font-medium text-red-600">- EGP {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                                        <Building className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Social Insurance</p>
                                        <p className="text-xs text-muted-foreground">Fixed amount</p>
                                    </div>
                                </div>
                                <span className="font-mono font-medium text-red-600">- EGP {insurance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>

                            {other > 0 && (
                                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">...</div>
                                        <div>
                                            <p className="font-medium">Other Deductions</p>
                                            <p className="text-xs text-muted-foreground">Miscellaneous</p>
                                        </div>
                                    </div>
                                    <span className="font-mono font-medium text-red-600">- EGP {other.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}

                            <div className="border-t pt-4 flex justify-between items-center mt-4">
                                <span className="font-bold">Total Deductions</span>
                                <span className="font-bold text-red-700">- EGP {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default StaffPayrollPage;
