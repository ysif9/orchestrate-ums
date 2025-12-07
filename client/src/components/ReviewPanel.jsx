import { useState } from 'react';
import { applicationService } from '../services/applicationService.js';
import { CheckCircle, XCircle, Clock, Send, FileText, Star } from 'lucide-react';

/**
 * Scoring criteria input component
 */
function ScoringCriterion({ name, label, value, maxScore, onChange }) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <label className="text-sm text-content font-medium">{label}</label>
            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    max={maxScore}
                    value={value}
                    onChange={(e) => onChange(name, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 border border-border rounded text-center text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
                <span className="text-sm text-content-secondary">/ {maxScore}</span>
            </div>
        </div>
    );
}

/**
 * Decision button component
 */
function DecisionButton({ decision, selected, onClick, icon: Icon, color }) {
    const colorClasses = {
        green: selected ? 'bg-green-500 text-white border-green-500' : 'border-green-300 text-green-600 hover:bg-green-50',
        red: selected ? 'bg-red-500 text-white border-red-500' : 'border-red-300 text-red-600 hover:bg-red-50',
        purple: selected ? 'bg-purple-500 text-white border-purple-500' : 'border-purple-300 text-purple-600 hover:bg-purple-50',
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-lg font-medium transition-all ${colorClasses[color]}`}
        >
            <Icon size={18} />
            {decision}
        </button>
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
function ReviewPanel({ application, onReviewSubmitted }) {
    const [finalDecision, setFinalDecision] = useState('');
    const [scores, setScores] = useState(
        defaultCriteria.reduce((acc, c) => ({ ...acc, [c.name]: 0 }), {})
    );
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const maxTotalScore = defaultCriteria.reduce((sum, c) => sum + c.maxScore, 0);

    const handleScoreChange = (name, value) => {
        const criterion = defaultCriteria.find((c) => c.name === name);
        const clampedValue = Math.min(Math.max(0, value), criterion?.maxScore || 100);
        setScores((prev) => ({ ...prev, [name]: clampedValue }));
    };

    const handleSubmit = async (e) => {
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
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit review. Please try again.');
            console.error('Error submitting review:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!application) {
        return (
            <div className="bg-surface rounded-lg shadow-card p-8 text-center text-content-secondary">
                Select an application to review
            </div>
        );
    }

    return (
        <div className="bg-surface rounded-lg shadow-card overflow-hidden">
            {/* Header */}
            <div className="bg-surface-tertiary px-6 py-4 border-b border-border">
                <h3 className="text-lg font-semibold text-content flex items-center gap-2">
                    <FileText size={20} className="text-brand-500" />
                    Application Review
                </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
                {/* Scoring Section */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Star size={16} />
                        Scoring Rubric
                    </h4>
                    <div className="bg-surface-tertiary rounded-lg p-4">
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
                        <div className="flex items-center justify-between pt-4 mt-2 border-t-2 border-brand-200">
                            <span className="font-semibold text-content">Total Score</span>
                            <span className="text-lg font-bold text-brand-600">
                                {totalScore} / {maxTotalScore}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Decision Section */}
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Final Decision</h4>
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
                <div className="mb-6">
                    <h4 className="text-sm font-semibold text-brand-600 uppercase tracking-wide mb-3">Comments</h4>
                    <textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any additional comments or notes about this application..."
                        rows={4}
                        className="w-full px-4 py-3 border border-border rounded-lg text-sm focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 resize-none"
                    />
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
                )}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg text-sm">{success}</div>
                )}

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading || !finalDecision}
                    className="w-full flex items-center justify-center gap-2 bg-brand-500 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-button hover:shadow-button-hover disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send size={18} />
                            Submit Review
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}

export default ReviewPanel;

