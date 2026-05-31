import { useState, useMemo } from 'react';
import { Button } from '../UI/Button';
import { WorkoutLibrary } from './WorkoutLibrary';
import { WorkoutBuilder } from './WorkoutBuilder';
import { exportWorkoutToPDF } from '../../utils/exportWorkoutPDF';

export const WorkoutList = ({
    workoutTemplates,
    exercises,
    clients = [],
    onCreateWorkoutTemplate,
    onDeleteWorkoutTemplate,
    onUpdateWorkoutTemplate,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showWorkoutLibrary, setShowWorkoutLibrary] = useState(false);
    const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
    // These are set but not currently used - kept for potential future use
    // eslint-disable-next-line no-unused-vars
    const [selectedDate, setSelectedDate] = useState(null);
    // eslint-disable-next-line no-unused-vars
    const [sessionTime, setSessionTime] = useState('');

    const getExerciseName = (exerciseId) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        return exercise?.name || 'Unknown Exercise';
    };

    // Only show workout templates (saved to library), not scheduled workouts
    // Scheduled workouts are managed in the Calendar view
    const filteredTemplates = useMemo(() => {
        let filtered = [...workoutTemplates];

        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(template => {
                const name = template.name?.toLowerCase() || '';
                const exerciseNames = (template.exercises || []).map(ex => 
                    getExerciseName(ex.exerciseId).toLowerCase()
                ).join(' ');
                const tags = (template.tags || []).join(' ').toLowerCase();
                return name.includes(lowerSearch) || 
                       exerciseNames.includes(lowerSearch) ||
                       tags.includes(lowerSearch);
            });
        }

        return filtered.sort((a, b) => {
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutTemplates, searchTerm]);

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleDeleteWorkout = async (template) => {
        if (window.confirm('Are you sure you want to delete this workout template from the library?')) {
            await onDeleteWorkoutTemplate(template.id);
        }
    };

    const handleUseTemplate = (template) => {
        setSelectedTemplate(template);
        setShowWorkoutLibrary(false);
        const today = new Date();
        setSelectedDate(today.toISOString().split('T')[0]);
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        setSessionTime(`${hours}:${minutes}`);
        setShowWorkoutBuilder(true);
    };

    const handleCreateNewWorkout = () => {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0];
        setSelectedDate(dateStr);
        const hours = String(today.getHours()).padStart(2, '0');
        const minutes = String(today.getMinutes()).padStart(2, '0');
        setSessionTime(`${hours}:${minutes}`);
        setSelectedTemplate(null); // Clear any selected template
        setShowWorkoutBuilder(true);
    };

    const handleCloseWorkoutBuilder = () => {
        setShowWorkoutBuilder(false);
        setSelectedTemplate(null);
        setSelectedDate(null);
        setSessionTime('');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Workout Library</h1>
                    <p className="text-gray-200 mt-1">
                        {workoutTemplates.length} saved workout templates
                    </p>
                    <p className="text-sm text-gray-300 mt-1">
                        Save workouts from the Workout Builder to build your library. Scheduled workouts are managed in the Calendar.
                    </p>
                </div>
                <Button
                    onClick={handleCreateNewWorkout}
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    }
                >
                    Create New Workout
                </Button>
            </div>

            {/* Search */}
            <div className="glass rounded-lg p-4">
                <input
                    type="text"
                    placeholder="Search workout templates by name, exercise, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                />
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        {searchTerm ? 'No templates found' : 'No workout templates yet'}
                    </h3>
                    <p className="text-gray-200 mb-6">
                        {searchTerm ? 'Try a different search term' : 'Save workouts from the Workout Builder to build your library'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTemplates.map(template => (
                        <div key={template.id} className="glass glass-hover rounded-xl p-6 space-y-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">
                                            Template
                                        </span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-white">
                                        {template.name || 'Unnamed Workout'}
                                    </h3>
                                </div>
                            </div>

                            {/* Exercise Preview */}
                            <div>
                                <p className="text-xs text-gray-200 mb-2">
                                    {template.exercises?.length || 0} exercises
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {template.exercises?.slice(0, 3).map((ex, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                                        >
                                            {getExerciseName(ex.exerciseId)}
                                        </span>
                                    ))}
                                    {template.exercises?.length > 3 && (
                                        <span className="text-xs text-gray-200">
                                            +{template.exercises.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>

                            <p className="text-xs text-gray-300">
                                Created {formatDate(new Date(template.createdAt))}
                            </p>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => {
                                        setSelectedTemplate(template);
                                        setShowWorkoutLibrary(true);
                                    }}
                                    className="flex-1"
                                >
                                    View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleUseTemplate(template)}
                                    className="flex-1"
                                >
                                    Use
                                </Button>
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => exportWorkoutToPDF({ workout: template, exercises })}
                                    title="Export as PDF"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDeleteWorkout(template)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Workout Library Modal */}
            <WorkoutLibrary
                isOpen={showWorkoutLibrary}
                onClose={() => {
                    setShowWorkoutLibrary(false);
                    setSelectedTemplate(null);
                }}
                workoutTemplates={workoutTemplates}
                exercises={exercises}
                clients={clients}
                onSelectTemplate={(template) => {
                    handleUseTemplate(template);
                }}
                onDeleteTemplate={onDeleteWorkoutTemplate}
                onUpdateTemplate={onUpdateWorkoutTemplate}
                onCreateWorkoutTemplate={onCreateWorkoutTemplate}
            />

            {/* Workout Builder for creating/editing library workouts */}
            {showWorkoutBuilder && (
                <WorkoutBuilder
                    isOpen={showWorkoutBuilder}
                    onClose={handleCloseWorkoutBuilder}
                    onBack={handleCloseWorkoutBuilder}
                    exercises={exercises}
                    existingWorkout={selectedTemplate ? {
                        id: selectedTemplate.id,
                        exercises: selectedTemplate.exercises,
                        isTemplate: true,
                    } : null}
                    onCreateWorkout={() => {}}
                    onUpdateWorkout={() => {}}
                    onDeleteWorkout={() => {}}
                    workoutTemplates={workoutTemplates}
                    onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                    onUpdateWorkoutTemplate={onUpdateWorkoutTemplate}
                    onDeleteWorkoutTemplate={onDeleteWorkoutTemplate}
                    isLibraryMode={true}
                />
            )}
        </div>
    );
};




