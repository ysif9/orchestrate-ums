import { useState } from 'react';
import { applicationService } from '../services/applicationService.js';
import { CheckCircle, XCircle, Clock, Send, FileText, Star } from 'lucide-react';
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

/**
 * Scoring criteria input component
 */
function ScoringCriterion({ name, label, value, maxScore, onChange }: any) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <Label className="text-sm font-medium">{label}</Label>
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    min="0"
                    max={maxScore}
                    value={value}
                    onChange={(e: any) => onChange(name, parseInt(e.target.value) || 0)}
                    className="w-20 text-center h-8"
                />
                <span className="text-sm text-muted-foreground">/ {maxScore}</span>
            </div>
        </div>
    );
}

/**
 * Decision button component
 */
function DecisionButton({ decision, selected, onClick, icon: Icon, color }: any) {
    const variant = selected ? "default" : "outline";
    // We can use custom classes for specific colors if Shadcn variants don't match exactly,
    // or just use Shadcn's semantic variants (default, destructive, secondary, outline).
    // For now, mapping broadly:

    let className = "flex-1 gap-2 h-12";
    if (selected) {
        if (color === 'red') className += " bg-red-600 hover:bg-red-700";
        if (color === 'green') className += " bg-green-600 hover:bg-green-700";
        if (color === 'purple') className += " bg-purple-600 hover:bg-purple-700";
    } else {
        if (color === 'red') className += " text-red-600 hover:bg-red-50 border-red-200";
        if (color === 'green') className += " text-green-600 hover:bg-green-50 border-green-200";
        if (color === 'purple') className += " text-purple-600 hover:bg-purple-50 border-purple-200";
    }

    return (
        <Button
            type="button"
            onClick={onClick}
            variant={selected ? "default" : "outline"}
            className={className}
        >
            <Icon size={18} />
            {decision}
        </Button>
    );
}

/**
 * Default scoring criteria
 */
const defaultCriteria = [
    { name: 'academicPerformance', label: 'Academic Performance', maxScore: 30 },
    { name: 'personalStatement', label: 'Personal Statement', maxScore: 25 },
    { name: 'recommendations', label: 'Recommendations', maxScore: 20 },
    { name: 'extracurriculars', label: 'Extracurricular Activities', maxScore: 15 },
    { name: 'interview', label: 'Interview (if applicable)', maxScore: 10 },
];

/**
 * ReviewPanel component for submitting application reviews
 */
function ReviewPanel({ application, onReviewSubmitted }: any) {
    const [finalDecision, setFinalDecision] = useState('');
    const [scores, setScores] = useState<any>(
        defaultCriteria.reduce((acc: any, c) => ({ ...acc, [c.name]: 0 }), {})
    );
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const totalScore = Object.values(scores).reduce((sum: any, score: any) => sum + score, 0);
    const maxTotalScore = defaultCriteria.reduce((sum, c) => sum + c.maxScore, 0);

    const handleScoreChange = (name: any, value: any) => {
        const criterion = defaultCriteria.find((c) => c.name === name);
        const clampedValue = Math.min(Math.max(0, value), criterion?.maxScore || 100);
        setScores((prev: any) => ({ ...prev, [name]: clampedValue }));
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!finalDecision) {
            setError('Please select a final decision');
            return;
        }

        if (!application?.id) {
            setError('No application selected');
            return;
        }

        try {
            setLoading(true);
            await applicationService.submitReview({
                applicationId: application.id,
                finalDecision,
                scoringRubric: scores,
                comments,
            });
            setSuccess('Review submitted successfully!');
            if (onReviewSubmitted) {
                onReviewSubmitted();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
            console.error('Error submitting review:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!application) {
        return (
            <Card className="p-8 text-center text-muted-foreground">
                Select an application to review
            </Card>
        );
    }

    return (
        <Card>
            {/* Header */}
            <CardHeader className="bg-muted/50 py-4 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Application Review
                </CardTitle>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-6">
                    {/* Scoring Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3 flex items-center gap-2">
                            <Star size={16} />
                            Scoring Rubric
                        </h4>
                        <div className="bg-muted/50 rounded-lg p-4">
                            {defaultCriteria.map((criterion) => (
                                <ScoringCriterion
                                    key={criterion.name}
                                    name={criterion.name}
                                    label={criterion.label}
                                    value={scores[criterion.name]}
                                    maxScore={criterion.maxScore}
                                    onChange={handleScoreChange}
                                />
                            ))}
                            <div className="flex items-center justify-between pt-4 mt-2 border-t border-border">
                                <span className="font-semibold">Total Score</span>
                                <span className="text-lg font-bold text-primary">
                                    {totalScore} / {maxTotalScore}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Decision Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Final Decision</h4>
                        <div className="flex gap-3">
                            <DecisionButton
                                decision="Accept"
                                selected={finalDecision === 'accepted'}
                                onClick={() => setFinalDecision('accepted')}
                                icon={CheckCircle}
                                color="green"
                            />
                            <DecisionButton
                                decision="Waitlist"
                                selected={finalDecision === 'waitlisted'}
                                onClick={() => setFinalDecision('waitlisted')}
                                icon={Clock}
                                color="purple"
                            />
                            <DecisionButton
                                decision="Reject"
                                selected={finalDecision === 'rejected'}
                                onClick={() => setFinalDecision('rejected')}
                                icon={XCircle}
                                color="red"
                            />
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div>
                        <h4 className="text-sm font-semibold text-primary uppercase tracking-wide mb-3">Comments</h4>
                        <Textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add any additional comments or notes about this application..."
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">{error}</div>
                    )}
                    {success && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
                    )}
                </CardContent>

                <CardFooter className="p-6 pt-0">
                    <Button
                        type="submit"
                        disabled={loading || !finalDecision}
                        className="w-full"
                        size="lg"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <Send size={18} className="mr-2" />
                                Submit Review
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}

export default ReviewPanel;
