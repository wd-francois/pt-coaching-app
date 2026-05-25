import { useState, useEffect, useMemo } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { WorkoutBuilder } from '../Workouts/WorkoutBuilder';
import { MeasurementsList } from './MeasurementsList';
import { MeasurementsForm } from './MeasurementsForm';
import PersonalBestForm from './PersonalBestForm';

export const ClientDetail = ({
    client,
    workouts = [],
    exercises = [],
    measurements = [],
    personalBests = [],
    onBack,
    onCreateMeasurement,
    onUpdateMeasurement,
    onDeleteMeasurement,
    onCreatePersonalBest,
    onUpdatePersonalBest,
    onDeletePersonalBest,
    getPersonalBestsByClient,
    getMeasurementsByClient,
    onUpdateWorkout,
    onDeleteWorkout,
    onCreateWorkout,
    workoutTemplates = [],
    onCreateWorkoutTemplate,
    onUpdateWorkoutTemplate,
}) => {
    const [activeTab, setActiveTab] = useState('workouts');
    const [clientMeasurements, setClientMeasurements] = useState([]);
    const [clientPersonalBests, setClientPersonalBests] = useState([]);
    const [showMeasurementsForm, setShowMeasurementsForm] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [showPersonalBestForm, setShowPersonalBestForm] = useState(false);
    const [editingPersonalBest, setEditingPersonalBest] = useState(null);
    const [loading, setLoading] = useState(false);
    const [editingWorkout, setEditingWorkout] = useState(null);
    const [editingWorkoutName, setEditingWorkoutName] = useState(null);
    const [editWorkoutName, setEditWorkoutName] = useState('');
    const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false);
    const [selectedWorkoutForUse, setSelectedWorkoutForUse] = useState(null);

    // Filter workouts for this client
    const clientWorkouts = useMemo(() => {
        if (!client) return [];
        return workouts
            .filter(w => w.clientId === client.id)
            .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA; // Most recent first
            });
    }, [workouts, client]);

    // Load measurements
    useEffect(() => {
        if (client && getMeasurementsByClient) {
            loadMeasurements();
        }
    }, [client, getMeasurementsByClient]);

    // Load personal bests
    useEffect(() => {
        if (client) {
            loadPersonalBests();
        }
    }, [client]);

    const loadMeasurements = async () => {
        if (!client || !getMeasurementsByClient) return;
        setLoading(true);
        try {
            const data = await getMeasurementsByClient(client.id);
            setClientMeasurements(data);
        } catch (error) {
            console.error('Error loading measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPersonalBests = async () => {
        if (!client) return;
        try {
            if (getPersonalBestsByClient) {
                const data = await getPersonalBestsByClient(client.id);
                setClientPersonalBests(data);
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(`personalBests_${client.id}`);
                const pbs = stored ? JSON.parse(stored) : [];
                setClientPersonalBests(pbs);
            }
        } catch (error) {
            console.error('Error loading personal bests:', error);
            setClientPersonalBests([]);
        }
    };

    const getExerciseName = (exerciseId) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        return exercise?.name || 'Unknown Exercise';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'No date';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeStr) => {
        if (!timeStr) return '';
        // If already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr;
        }
        return timeStr;
    };

    const formatDateShort = (dateStr) => {
        if (!dateStr) return 'Unknown date';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleRenameWorkout = (e, workout) => {
        e.stopPropagation();
        setEditingWorkoutName(workout);
        setEditWorkoutName(workout.name || formatDate(workout.date));
    };

    const handleSaveRename = async () => {
        if (!editWorkoutName || !editWorkoutName.trim()) {
            alert('Please enter a name for this workout');
            return;
        }

        if (editingWorkoutName && onUpdateWorkout) {
            await onUpdateWorkout(editingWorkoutName.id, { name: editWorkoutName.trim() });
            setEditingWorkoutName(null);
            setEditWorkoutName('');
        }
    };

    const handleCancelRename = () => {
        setEditingWorkoutName(null);
        setEditWorkoutName('');
    };

    const handleEditWorkout = (e, workout) => {
        e.stopPropagation();
        setEditingWorkout(workout);
    };

    const handleCloseWorkoutBuilder = () => {
        setEditingWorkout(null);
        setShowWorkoutBuilder(false);
        setSelectedWorkoutForUse(null);
    };

    const handleDeleteWorkout = async (e, workoutId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this workout?')) {
            await onDeleteWorkout(workoutId);
        }
    };

    const handleUseWorkout = (workout) => {
        setSelectedWorkoutForUse(workout);
        setShowWorkoutBuilder(true);
    };

    const handleMeasurementSubmit = async (measurementData) => {
        try {
            const payload = { ...measurementData, clientId: client.id };
            if (payload.date == null) {
                payload.date = editingMeasurement?.date ?? Date.now();
            }
            if (editingMeasurement) {
                await onUpdateMeasurement(editingMeasurement.id, payload);
            } else {
                await onCreateMeasurement(payload);
            }
            setShowMeasurementsForm(false);
            setEditingMeasurement(null);
            await loadMeasurements();
        } catch (error) {
            console.error('Error saving measurement:', error);
        }
    };

    const handlePersonalBestSubmit = async (personalBestData) => {
        try {
            if (editingPersonalBest) {
                await onUpdatePersonalBest(editingPersonalBest.id, {
                    ...personalBestData,
                    clientId: client.id
                });
            } else {
                await onCreatePersonalBest({
                    ...personalBestData,
                    clientId: client.id
                });
            }
            setShowPersonalBestForm(false);
            setEditingPersonalBest(null);
            await loadPersonalBests();
        } catch (error) {
            console.error('Error saving personal best:', error);
        }
    };

    if (!client) {
        return (
            <div className="space-y-6">
                <Button onClick={onBack} variant="ghost">
                    ← Back to Clients
                </Button>
                <div className="glass rounded-lg p-8 text-center">
                    <p className="text-gray-200">Client not found</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button onClick={onBack} variant="ghost" size="sm">
                    ← Back
                </Button>
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-purple-600/30 flex items-center justify-center">
                        <span className="text-purple-400 font-semibold text-2xl">
                            {client.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">{client.name}</h1>
                        {(client.email || client.phone) && (
                            <p className="text-gray-200">
                                {client.email || client.phone}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('workouts')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'workouts'
                            ? 'text-purple-400 border-b-2 border-purple-400'
                            : 'text-gray-200 hover:text-white'
                    }`}
                >
                    Workouts ({clientWorkouts.length})
                </button>
                <button
                    onClick={() => setActiveTab('measurements')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'measurements'
                            ? 'text-purple-400 border-b-2 border-purple-400'
                            : 'text-gray-200 hover:text-white'
                    }`}
                >
                    Measurements ({clientMeasurements.length})
                </button>
                <button
                    onClick={() => setActiveTab('personalBests')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        activeTab === 'personalBests'
                            ? 'text-purple-400 border-b-2 border-purple-400'
                            : 'text-gray-200 hover:text-white'
                    }`}
                >
                    Personal Bests ({clientPersonalBests.length})
                </button>
            </div>

            {/* Workouts Tab */}
            {activeTab === 'workouts' && (
                <div className="space-y-4">
                    {clientWorkouts.length === 0 ? (
                        <div className="glass rounded-lg p-8 text-center">
                            <p className="text-gray-200">No workouts found for this client</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {clientWorkouts.map(workout => (
                                <div
                                    key={workout.id}
                                    className="glass rounded-lg p-4 hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex flex-col h-full">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-white text-lg flex-1">
                                                    {workout.name || formatDateShort(workout.date)}
                                                </h3>
                                                <span className="text-xs text-gray-200 bg-white/10 px-2 py-1 rounded-full">
                                                    {workout.exercises?.length || 0} exercises
                                                </span>
                                            </div>
                                            
                                            {/* Date and Time */}
                                            {workout.name && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-200">
                                                        {formatDateShort(workout.date)}
                                                        {workout.time && ` • ${formatTime(workout.time)}`}
                                                    </p>
                                                </div>
                                            )}
                                            {!workout.name && workout.time && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-200">
                                                        {formatTime(workout.time)}
                                                    </p>
                                                </div>
                                            )}
                                            
                                            {/* Exercise Preview */}
                                            {workout.exercises && workout.exercises.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="text-sm text-gray-200 mb-1">Exercises:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {workout.exercises.slice(0, 5).map((ex, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                                                            >
                                                                {getExerciseName(ex.exerciseId)}
                                                            </span>
                                                        ))}
                                                        {workout.exercises.length > 5 && (
                                                            <span className="text-xs text-gray-200">
                                                                +{workout.exercises.length - 5} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Session Notes */}
                                            {workout.notes && (
                                                <div className="mb-3 pt-3 border-t border-white/10">
                                                    <p className="text-sm text-gray-200 mb-1">Session Notes:</p>
                                                    <p className="text-sm text-gray-100 whitespace-pre-wrap">
                                                        {workout.notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                                            <Button
                                                onClick={() => handleUseWorkout(workout)}
                                                className="flex-1"
                                                size="sm"
                                            >
                                                Use Workout
                                            </Button>
                                            {onUpdateWorkout && (
                                                <>
                                                    <button
                                                        onClick={(e) => handleEditWorkout(e, workout)}
                                                        className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                                                        title="Edit workout"
                                                    >
                                                        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={(e) => handleRenameWorkout(e, workout)}
                                                        className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        title="Rename workout"
                                                    >
                                                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={(e) => handleDeleteWorkout(e, workout.id)}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete workout"
                                            >
                                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Measurements Tab */}
            {activeTab === 'measurements' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                setEditingMeasurement(null);
                                setShowMeasurementsForm(true);
                            }}
                            variant="primary"
                            size="sm"
                        >
                            + Add Measurement
                        </Button>
                    </div>
                    {loading ? (
                        <div className="glass rounded-lg p-8 text-center">
                            <p className="text-gray-200">Loading measurements...</p>
                        </div>
                    ) : clientMeasurements.length === 0 ? (
                        <div className="glass rounded-lg p-8 text-center">
                            <p className="text-gray-200">No measurements recorded</p>
                        </div>
                    ) : (
                        <MeasurementsList
                            measurements={clientMeasurements}
                            onEdit={(measurement) => {
                                setEditingMeasurement(measurement);
                                setShowMeasurementsForm(true);
                            }}
                            onDelete={async (id) => {
                                if (window.confirm('Are you sure you want to delete this measurement?')) {
                                    await onDeleteMeasurement(id);
                                    await loadMeasurements();
                                }
                            }}
                        />
                    )}
                </div>
            )}

            {/* Personal Bests Tab */}
            {activeTab === 'personalBests' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button
                            onClick={() => {
                                setEditingPersonalBest(null);
                                setShowPersonalBestForm(true);
                            }}
                            variant="primary"
                            size="sm"
                        >
                            + Add Personal Best
                        </Button>
                    </div>
                    {clientPersonalBests.length === 0 ? (
                        <div className="glass rounded-lg p-8 text-center">
                            <p className="text-gray-200">No personal bests recorded</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clientPersonalBests.map(pb => (
                                <div key={pb.id} className="glass rounded-lg p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-white text-lg">
                                                {pb.exerciseName || getExerciseName(pb.exerciseId)}
                                            </h4>
                                            <div className="mt-2 flex items-center gap-4">
                                                <span className="text-yellow-400 font-medium">
                                                    {pb.reps} reps @ {pb.weight}
                                                </span>
                                                {pb.date && (
                                                    <span className="text-sm text-gray-200">
                                                        {formatDate(new Date(pb.date).toISOString().split('T')[0])}
                                                    </span>
                                                )}
                                            </div>
                                            {pb.notes && (
                                                <p className="text-sm text-gray-200 mt-2">{pb.notes}</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingPersonalBest(pb);
                                                    setShowPersonalBestForm(true);
                                                }}
                                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                                aria-label="Edit personal best"
                                            >
                                                <svg className="w-4 h-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (window.confirm('Are you sure you want to delete this personal best?')) {
                                                        await onDeletePersonalBest(pb.id, client.id);
                                                        await loadPersonalBests();
                                                    }
                                                }}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                                aria-label="Delete personal best"
                                            >
                                                <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            {showMeasurementsForm && (
                <MeasurementsForm
                    isOpen={showMeasurementsForm}
                    onClose={() => {
                        setShowMeasurementsForm(false);
                        setEditingMeasurement(null);
                    }}
                    onSubmit={handleMeasurementSubmit}
                    initialData={editingMeasurement}
                />
            )}

            {showPersonalBestForm && (
                <Modal
                    isOpen={showPersonalBestForm}
                    onClose={() => {
                        setShowPersonalBestForm(false);
                        setEditingPersonalBest(null);
                    }}
                    title={editingPersonalBest ? 'Edit Personal Best' : 'Add Personal Best'}
                    size="md"
                >
                    <PersonalBestForm
                        onSubmit={handlePersonalBestSubmit}
                        onCancel={() => {
                            setShowPersonalBestForm(false);
                            setEditingPersonalBest(null);
                        }}
                        initialData={editingPersonalBest}
                        exercises={exercises}
                    />
                </Modal>
            )}

            {/* Rename Workout Dialog */}
            {editingWorkoutName && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="relative w-full max-w-md glass rounded-2xl shadow-2xl animate-scale-in">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-white mb-4">Rename Workout</h2>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="edit-workout-name" className="block text-sm font-medium text-gray-100 mb-2">
                                        Workout Name
                                    </label>
                                    <input
                                        id="edit-workout-name"
                                        type="text"
                                        value={editWorkoutName}
                                        onChange={(e) => setEditWorkoutName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && editWorkoutName.trim()) {
                                                handleSaveRename();
                                            }
                                        }}
                                        placeholder="Enter a name for this workout..."
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-3 pt-4 border-t border-white/10">
                                    <Button 
                                        onClick={handleCancelRename} 
                                        variant="ghost" 
                                        className="flex-1"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={handleSaveRename}
                                        className="flex-1"
                                        disabled={!editWorkoutName.trim()}
                                    >
                                        Save
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Workout Builder for Editing */}
            {editingWorkout && (
                <WorkoutBuilder
                    isOpen={!!editingWorkout}
                    onClose={handleCloseWorkoutBuilder}
                    onBack={handleCloseWorkoutBuilder}
                    exercises={exercises}
                    client={client}
                    selectedDate={editingWorkout.date}
                    sessionTime={editingWorkout.time || ''}
                    existingWorkout={editingWorkout}
                    workouts={workouts}
                    onCreateWorkout={onCreateWorkout}
                    onUpdateWorkout={async (id, updates) => {
                        await onUpdateWorkout(id, updates);
                        handleCloseWorkoutBuilder();
                    }}
                    onDeleteWorkout={onDeleteWorkout}
                    workoutTemplates={workoutTemplates}
                    onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                    onUpdateWorkoutTemplate={onUpdateWorkoutTemplate}
                />
            )}

            {/* Workout Builder for Using/Duplicating */}
            {showWorkoutBuilder && selectedWorkoutForUse && (
                <WorkoutBuilder
                    isOpen={showWorkoutBuilder}
                    onClose={handleCloseWorkoutBuilder}
                    onBack={handleCloseWorkoutBuilder}
                    exercises={exercises}
                    client={client}
                    selectedDate={new Date().toISOString().split('T')[0]}
                    sessionTime={selectedWorkoutForUse.time || ''}
                    initialExercises={selectedWorkoutForUse.exercises || []}
                    workouts={workouts}
                    onCreateWorkout={onCreateWorkout}
                    onUpdateWorkout={onUpdateWorkout}
                    onDeleteWorkout={onDeleteWorkout}
                    workoutTemplates={workoutTemplates}
                    onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                    onUpdateWorkoutTemplate={onUpdateWorkoutTemplate}
                />
            )}
        </div>
    );
};
