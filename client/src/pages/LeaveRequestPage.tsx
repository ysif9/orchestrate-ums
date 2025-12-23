import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { authService } from '@/services/authService';
import { useNavigate } from 'react-router-dom';

const LeaveRequestPage = () => {
    const user = authService.getCurrentUser();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [leaveType, setLeaveType] = useState<string>('');
    const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
        from: undefined,
        to: undefined,
    });
    const [reason, setReason] = useState('');

    // Use environment variable or fallback to default local API URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!leaveType || !dateRange.from || !dateRange.to) {
            toast.error("Error", {
                description: "Please fill in all required fields",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post(`${API_URL}/api/leave-requests`, {
                type: leaveType,
                startDate: dateRange.from,
                endDate: dateRange.to,
                reason,
            });

            toast.success("Success", {
                description: "Leave request submitted successfully",
            });
            navigate('/faculty/leave-history');
        } catch (error: any) {
            // Log the error to see what's happening
            console.error("Submission error:", error);
            toast.error("Error", {
                description: error.response?.data?.message || "Failed to submit request",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        const user: any = authService.getCurrentUser();
        if (user?.role === 'teaching_assistant') {
            navigate('/ta-dashboard');
        } else {
            navigate('/admin/home');
        }
    };

    return (
        <div className="container mx-auto py-8 max-w-2xl">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Submit Leave Request</CardTitle>
                            <CardDescription>Request time off for annual, sick, or emergency leave.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Dashboard
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="leave-type">Leave Type</Label>
                            <Select onValueChange={setLeaveType} value={leaveType}>
                                <SelectTrigger id="leave-type">
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="annual">Annual Leave</SelectItem>
                                    <SelectItem value="sick">Sick Leave</SelectItem>
                                    <SelectItem value="emergency">Emergency Leave</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <div className="grid gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="date"
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !dateRange.from && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange.from ? (
                                                dateRange.to ? (
                                                    <>
                                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                                        {format(dateRange.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(dateRange.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date range</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            initialFocus
                                            mode="range"
                                            defaultMonth={dateRange.from}
                                            selected={dateRange}
                                            onSelect={(range) => setDateRange(range || { from: undefined, to: undefined })}
                                            numberOfMonths={2}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason (Optional)</Label>
                            <Textarea
                                id="reason"
                                placeholder="Provide a reason for your leave request..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "Submit Request"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LeaveRequestPage;
