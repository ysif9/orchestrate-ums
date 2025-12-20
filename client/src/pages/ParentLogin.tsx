import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/authService.js';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from 'lucide-react';

function ParentLogin() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        linkingCode: '',
        parentName: ''
    });
    const [errors, setErrors] = useState<any>({});
    const [apiError, setApiError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isFirstTime, setIsFirstTime] = useState(false);

    // Redirect to parent home if already authenticated as parent
    useEffect(() => {
        if (authService.isAuthenticated()) {
            const user = authService.getCurrentUser();
            if (user?.role === 'parent') {
                navigate('/parent/home', { replace: true });
            }
        }
    }, [navigate]);

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors((prev: any) => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors: any = {};

        if (!formData.linkingCode.trim()) {
            newErrors.linkingCode = 'Linking code is required';
        } else if (formData.linkingCode.trim().length !== 8) {
            newErrors.linkingCode = 'Linking code must be 8 characters';
        }

        if (isFirstTime && !formData.parentName.trim()) {
            newErrors.parentName = 'Your name is required for first-time login';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setApiError('');

        try {
            const loginData: any = {
                linkingCode: formData.linkingCode.trim().toUpperCase()
            };

            if (isFirstTime && formData.parentName.trim()) {
                loginData.parentName = formData.parentName.trim();
            }

            const response = await authService.parentLogin(loginData);

            if (response.success) {
                navigate('/parent/home');
            }
        } catch (err: any) {
            console.error('Parent login error:', err);
            
            // Check if it's a first-time login error
            if (err.response?.data?.message?.includes('Parent name is required')) {
                setIsFirstTime(true);
                setApiError('First-time login detected. Please enter your name to continue.');
            } else {
                setApiError(err.response?.data?.message || 'Invalid linking code. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-muted/20">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-primary">Parent Portal</CardTitle>
                    <CardDescription>Access your child's academic information</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-sm text-blue-800">
                            Enter your unique 8-character linking code to access the parent portal. 
                            {!isFirstTime && " If this is your first time, you'll be asked to provide your name."}
                        </AlertDescription>
                    </Alert>

                    {apiError && (
                        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg mb-6 text-sm border border-destructive/20">
                            {apiError}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <Label htmlFor="linkingCode">Linking Code</Label>
                            <Input
                                type="text"
                                id="linkingCode"
                                name="linkingCode"
                                value={formData.linkingCode}
                                onChange={handleChange}
                                placeholder="Enter 8-character code"
                                maxLength={8}
                                disabled={loading}
                                className={`uppercase ${errors.linkingCode ? "border-destructive" : ""}`}
                            />
                            {errors.linkingCode && <span className="text-destructive text-sm">{errors.linkingCode}</span>}
                        </div>

                        {isFirstTime && (
                            <div className="space-y-2">
                                <Label htmlFor="parentName">Your Name</Label>
                                <Input
                                    type="text"
                                    id="parentName"
                                    name="parentName"
                                    value={formData.parentName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    disabled={loading}
                                    className={errors.parentName ? "border-destructive" : ""}
                                />
                                {errors.parentName && <span className="text-destructive text-sm">{errors.parentName}</span>}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Access Portal'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
                    <p>Not a parent?</p>
                    <Link to="/login" className="text-primary hover:underline">
                        Sign in as Student or Staff
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default ParentLogin;

