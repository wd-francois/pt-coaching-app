import { useState, useMemo } from 'react';
import { Button } from '../UI/Button';

export const GoalComparison = ({ measurements = [], goals = {} }) => {
    const [isVisible, setIsVisible] = useState(true);

    // Calculate progress for each goal
    const progressData = useMemo(() => {
        if (!measurements || measurements.length === 0) return [];
        
        const latest = measurements[0]; // Assuming sorted by date, newest first
        const progress = [];

        // Weight goal
        if (goals.weight && latest.weight) {
            const difference = latest.weight - goals.weight;
            const progressPercent = goals.weight > latest.weight 
                ? ((goals.weight - latest.weight) / (latest.weight - goals.startWeight || latest.weight)) * 100
                : 100;
            progress.push({
                label: 'Weight',
                current: latest.weight,
                goal: goals.weight,
                difference: Math.abs(difference),
                isAchieved: difference <= 0,
                progress: Math.min(100, Math.max(0, progressPercent)),
                unit: 'kg'
            });
        }

        // Waist goal
        if (goals.waist && latest.waist) {
            const difference = latest.waist - goals.waist;
            const isAchieved = difference <= 0;
            progress.push({
                label: 'Waist',
                current: latest.waist,
                goal: goals.waist,
                difference: Math.abs(difference),
                isAchieved,
                progress: isAchieved ? 100 : 50,
                unit: 'cm'
            });
        }

        // Chest goal
        if (goals.chest && latest.chest) {
            const difference = goals.chest - latest.chest;
            const isAchieved = difference <= 0;
            progress.push({
                label: 'Chest',
                current: latest.chest,
                goal: goals.chest,
                difference: Math.abs(difference),
                isAchieved,
                progress: isAchieved ? 100 : 50,
                unit: 'cm'
            });
        }

        return progress;
    }, [measurements, goals]);

    if (!isVisible && progressData.length === 0) return null;

    return (
        <div className="glass rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Goal Progress</h3>
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    aria-label={isVisible ? 'Hide goal comparison' : 'Show goal comparison'}
                    aria-expanded={isVisible}
                    className="text-gray-200 hover:text-white transition-colors p-1"
                >
                    <svg 
                        className="w-5 h-5" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d={isVisible ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} 
                        />
                    </svg>
                </button>
            </div>

            {isVisible && (
                <div className="space-y-3">
                    {progressData.length === 0 ? (
                        <p className="text-gray-200 text-sm">No goals set or measurements available for comparison.</p>
                    ) : (
                        progressData.map((item, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-100 font-medium">{item.label}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white">
                                            {item.current} {item.unit}
                                        </span>
                                        <span className="text-gray-200">→</span>
                                        <span className={`font-semibold ${item.isAchieved ? 'text-green-400' : 'text-purple-400'}`}>
                                            {item.goal} {item.unit}
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${
                                            item.isAchieved 
                                                ? 'bg-green-500' 
                                                : 'bg-purple-500'
                                        }`}
                                        style={{ width: `${item.progress}%` }}
                                        role="progressbar"
                                        aria-valuenow={item.progress}
                                        aria-valuemin="0"
                                        aria-valuemax="100"
                                        aria-label={`${item.label} progress: ${item.progress.toFixed(0)}%`}
                                    />
                                </div>
                                {!item.isAchieved && (
                                    <p className="text-xs text-gray-200">
                                        {item.difference.toFixed(1)} {item.unit} to go
                                    </p>
                                )}
                                {item.isAchieved && (
                                    <p className="text-xs text-green-400">
                                        Goal achieved! ✓
                                    </p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
