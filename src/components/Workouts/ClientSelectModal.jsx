import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { WorkoutBuilder } from './WorkoutBuilder';
import { TimeInput24Hour } from '../UI/TimeInput24Hour';
import { WorkoutLibrary } from './WorkoutLibrary';

export const ClientSelectModal = ({
    isOpen,
    onClose,
    selectedDate,
    clients,
    exercises,
    workouts,
    onCreateWorkout,
    onUpdateWorkout,
    onDeleteWorkout,
    workoutTemplates = [],
    onCreateWorkoutTemplate = null,
    onUpdateWorkoutTemplate = null,
    onDeleteWorkoutTemplate = null,
    onCreatePersonalBest = null,
    onDeletePersonalBest = null,
}) => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedClients, setSelectedClients] = useState([]);
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupClientIndex, setGroupClientIndex] = useState(0);
    // eslint-disable-next-line no-unused-vars
    const [groupWorkouts, setGroupWorkouts] = useState({}); // Store workouts for each client in group
    const [searchTerm, setSearchTerm] = useState('');
    const [sessionTime, setSessionTime] = useState('');
    const [showWorkoutLibrary, setShowWorkoutLibrary] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showAddClientsModal, setShowAddClientsModal] = useState(false);
    const [selectedClientsToAdd, setSelectedClientsToAdd] = useState([]);
    const [addClientsSearchTerm, setAddClientsSearchTerm] = useState('');

    const existingWorkouts = workouts.filter(w => w.date === selectedDate);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleClientSelect = (client) => {
        if (isGroupMode) {
            // Toggle client selection in group mode
            setSelectedClients(prev => {
                const isSelected = prev.some(c => c.id === client.id);
                if (isSelected) {
                    return prev.filter(c => c.id !== client.id);
                } else {
                    return [...prev, client];
                }
            });
        } else {
            console.log('Selecting client:', client.name, 'with template:', selectedTemplate?.name);
            setSelectedClient(client);
            // Template will be loaded via initialExercises prop
        }
    };

    const handleGroupModeToggle = () => {
        setIsGroupMode(!isGroupMode);
        setSelectedClients([]);
        setSelectedClient(null);
    };

    const handleContinueWithGroup = () => {
        if (selectedClients.length === 0) {
            alert('Please select at least one client for the group session');
            return;
        }
        // Generate a consistent group session ID for all clients
        const groupSessionId = `group-${selectedDate}-${sessionTime || Date.now()}-${Date.now()}`;
        // Start with the first client
        setGroupClientIndex(0);
        console.log('Starting group session with template:', selectedTemplate?.name);
        setSelectedClient({ 
            ...selectedClients[0], 
            groupClients: selectedClients, 
            isGroupSession: true,
            groupSessionId: groupSessionId
        });
        // Template will persist and be applied to all clients in the group
    };

    // eslint-disable-next-line no-unused-vars
    const handleNextClientInGroup = () => {
        if (!selectedClient?.groupClients) return;
        const nextIndex = groupClientIndex + 1;
        if (nextIndex < selectedClient.groupClients.length) {
            setGroupClientIndex(nextIndex);
            setSelectedClient({ 
                ...selectedClient.groupClients[nextIndex], 
                groupClients: selectedClient.groupClients, 
                isGroupSession: true,
                groupSessionId: selectedClient.groupSessionId // Preserve group session ID
            });
        }
    };

    const handlePreviousClientInGroup = () => {
        if (!selectedClient?.groupClients) return;
        const prevIndex = groupClientIndex - 1;
        if (prevIndex >= 0) {
            navigateToClientIndex(prevIndex);
        }
    };

    const navigateToClientIndex = (targetIndex) => {
        if (!selectedClient?.groupClients) return;
        if (targetIndex < 0 || targetIndex >= selectedClient.groupClients.length) return;
        
        const targetClient = selectedClient.groupClients[targetIndex];
        setGroupClientIndex(targetIndex);
        setSelectedClient({ 
            ...targetClient, 
            groupClients: selectedClient.groupClients, 
            isGroupSession: true,
            groupSessionId: selectedClient.groupSessionId // Preserve group session ID
        });
    };

    const handleGroupWorkoutSave = async (data) => {
        try {
            // Handle both wrapped and unwrapped data formats
            const sourceWorkoutData = data.workoutData || data;
            const existingWorkoutInfo = data.existingWorkout;

            // Capture current state values at the time of save
            // This ensures we're working with the correct client and index
            const currentClient = selectedClient;
            const currentIndex = groupClientIndex;

            // Create a NEW workoutData object to avoid mutating the original
            // This is critical to preserve each client's individual data
            const workoutData = {
                ...sourceWorkoutData, // Copy all original data (including exercises)
                // Explicitly preserve exercises array
                exercises: sourceWorkoutData.exercises ? [...sourceWorkoutData.exercises] : [],
                // Override with current client's information
                clientId: currentClient?.id,
                // Ensure all clients in group session have the same time
                time: sessionTime || sourceWorkoutData.time || '',
            };
            
            // Deep copy exercises to ensure we don't mutate the original
            if (workoutData.exercises && workoutData.exercises.length > 0) {
                workoutData.exercises = workoutData.exercises.map(ex => ({
                    ...ex,
                    sets: ex.sets ? ex.sets.map(set => ({ ...set })) : []
                }));
            }

            // Validate client ID
            if (!workoutData.clientId) {
                console.error('No current client ID available for workout save');
                throw new Error('Cannot save workout: no client ID available');
            }

            // Ensure groupSessionId is set
            if (currentClient?.isGroupSession && currentClient?.groupSessionId) {
                workoutData.groupSessionId = currentClient.groupSessionId;
            }

            // Ensure isGroup flag is set
            if (currentClient?.isGroupSession) {
                workoutData.isGroup = true;
            }
            
            // Update all other workouts in the group session to have the same time
            if (currentClient?.groupSessionId && workoutData.time) {
                const groupWorkouts = workouts.filter(w => 
                    w.groupSessionId === currentClient.groupSessionId && 
                    w.date === selectedDate &&
                    w.id !== existingWorkoutInfo?.id // Don't update the current workout (we'll save it below)
                );
                
                // Update all other workouts in the group to have the same time
                for (const groupWorkout of groupWorkouts) {
                    if (groupWorkout.time !== workoutData.time) {
                        await onUpdateWorkout(groupWorkout.id, {
                            ...groupWorkout,
                            time: workoutData.time
                        });
                    }
                }
            }

            // Validate that exercises are included
            if (!workoutData.exercises || workoutData.exercises.length === 0) {
                console.warn('No exercises in workout data - this might be an issue');
            }

            console.log('Saving group workout:', {
                workoutData: {
                    date: workoutData.date,
                    clientId: workoutData.clientId,
                    time: workoutData.time,
                    isGroup: workoutData.isGroup,
                    groupSessionId: workoutData.groupSessionId,
                    exercisesCount: workoutData.exercises?.length || 0,
                    exercises: workoutData.exercises?.map(ex => ({
                        exerciseId: ex.exerciseId,
                        setsCount: ex.sets?.length || 0
                    }))
                },
                existingWorkoutInfo,
                currentIndex,
                totalClients: currentClient?.groupClients?.length,
                clientName: currentClient?.name,
                hasExercises: !!workoutData.exercises && workoutData.exercises.length > 0
            });

            // Save the workout - use the correct workout ID for updates
            if (existingWorkoutInfo && existingWorkoutInfo.id) {
                // Make sure we're updating the correct workout (verify clientId matches)
                const existingWorkout = workouts.find(w => w.id === existingWorkoutInfo.id);
                if (existingWorkout && existingWorkout.clientId !== workoutData.clientId) {
                    console.error('Mismatch: existing workout clientId does not match current client!', {
                        existingClientId: existingWorkout.clientId,
                        currentClientId: workoutData.clientId
                    });
                    // Still proceed, but log the issue
                }
                await onUpdateWorkout(existingWorkoutInfo.id, workoutData);
            } else {
                await onCreateWorkout(workoutData);
            }

            // Navigate to next client using captured values
            const totalClients = currentClient?.groupClients?.length || 0;
            const nextIndex = currentIndex + 1;
            
            console.log('Navigation check:', {
                currentIndex,
                nextIndex,
                totalClients,
                shouldMoveNext: nextIndex < totalClients,
                currentClientName: currentClient?.name
            });

            if (nextIndex < totalClients && currentClient?.groupClients) {
                // Move to next client
                const nextClient = currentClient.groupClients[nextIndex];
                console.log('Moving to next client:', nextClient.name);
                
                // Update both states atomically
                setGroupClientIndex(nextIndex);
                setSelectedClient({ 
                    ...nextClient, 
                    groupClients: currentClient.groupClients, 
                    isGroupSession: true,
                    groupSessionId: currentClient.groupSessionId
                });
            } else {
                // All clients done, close the modal
                console.log('All clients completed, closing modal');
                handleClose();
            }
        } catch (error) {
            console.error('Error saving group workout:', error);
            alert(`Failed to save workout for ${selectedClient?.name || 'client'}. Please try again.`);
            throw error; // Re-throw to let WorkoutBuilder handle setSaving(false)
        }
    };

    // Get existing workout time if editing
    const getExistingWorkoutTime = (clientId, groupSessionId = null) => {
        // For group sessions, get time from any workout in the group
        if (groupSessionId) {
            const groupWorkout = workouts.find(w => 
                w.groupSessionId === groupSessionId && 
                w.date === selectedDate &&
                w.time // Get one that has a time set
            );
            if (groupWorkout) {
                return groupWorkout.time;
            }
        }
        
        // For single client, get their specific workout time
        const existingWorkout = workouts.find(w => w.date === selectedDate && w.clientId === clientId);
        return existingWorkout?.time || '';
    };

    // Helper function to format time to 24-hour format (HH:MM)
    const formatTime24Hour = (timeStr) => {
        if (!timeStr) return '';
        // If already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr;
        }
        // If in HH:MM:SS format, remove seconds
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr.substring(0, 5);
        }
        // Try to parse and convert to 24-hour format
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);
            if (!isNaN(h) && !isNaN(m)) {
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        } catch {
            // If parsing fails, return original
        }
        return timeStr;
    };

    // Initialize time when client is selected
    useEffect(() => {
        if (selectedClient) {
            // For group sessions, get time from any workout in the group
            const groupSessionId = selectedClient.isGroupSession ? selectedClient.groupSessionId : null;
            const existingTime = getExistingWorkoutTime(selectedClient.id, groupSessionId);
            if (existingTime) {
                // Use functional update to avoid setState in effect warning
                setSessionTime(prev => formatTime24Hour(existingTime) || prev);
            } else {
                // Default to current time in HH:MM format (24-hour)
                const now = new Date();
                const hours = String(now.getHours()).padStart(2, '0');
                const minutes = String(now.getMinutes()).padStart(2, '0');
                setSessionTime(`${hours}:${minutes}`);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedClient, selectedDate, workouts]);

    const handleBack = () => {
        setSelectedClient(null);
        setSelectedClients([]);
        setIsGroupMode(false);
    };

    const handleClose = () => {
        setSelectedClient(null);
        setSelectedClients([]);
        setIsGroupMode(false);
        setSearchTerm('');
        setSessionTime('');
        setShowWorkoutLibrary(false);
        setSelectedTemplate(null);
        setShowAddClientsModal(false);
        setSelectedClientsToAdd([]);
        onClose();
    };

    const handleAddClientsToGroup = () => {
        setShowAddClientsModal(true);
        setSelectedClientsToAdd([]);
    };

    const handleClientToggleForAdd = (client) => {
        setSelectedClientsToAdd(prev => {
            const isSelected = prev.some(c => c.id === client.id);
            if (isSelected) {
                return prev.filter(c => c.id !== client.id);
            } else {
                return [...prev, client];
            }
        });
    };

    const handleConfirmAddClients = async () => {
        if (selectedClientsToAdd.length === 0) {
            alert('Please select at least one client to add to the group session');
            return;
        }

        if (!selectedClient?.groupSessionId) {
            alert('Error: No group session ID found');
            return;
        }

        // Get existing group clients to avoid duplicates
        const existingClientIds = selectedClient.groupClients.map(c => c.id);
        const newClients = selectedClientsToAdd.filter(c => !existingClientIds.includes(c.id));

        if (newClients.length === 0) {
            alert('All selected clients are already in this group session');
            setShowAddClientsModal(false);
            setSelectedClientsToAdd([]);
            return;
        }

        try {
            // Get the first existing workout to use as a template for new clients
            const existingGroupWorkout = workouts.find(w => 
                w.groupSessionId === selectedClient.groupSessionId && 
                w.date === selectedDate
            );

            // Deep copy exercises if they exist
            const exercisesTemplate = existingGroupWorkout?.exercises ? 
                JSON.parse(JSON.stringify(existingGroupWorkout.exercises)) : [];

            // Get the group session time (from current sessionTime or any existing workout)
            const groupTime = sessionTime || existingGroupWorkout?.time || '';
            
            // Create workouts for new clients with the same time as the group
            const createdWorkouts = [];
            for (const newClient of newClients) {
                const workoutData = {
                    date: selectedDate,
                    clientId: newClient.id,
                    time: groupTime, // Use the group session time
                    isGroup: true,
                    groupSessionId: selectedClient.groupSessionId,
                    exercises: exercisesTemplate
                };

                await onCreateWorkout(workoutData);
                createdWorkouts.push(newClient);
            }

            // Update the selectedClient's groupClients array with newly added clients
            // This provides immediate UI feedback. The parent component should update
            // the workouts array, and groupClients will be reconstructed from workouts
            // on the next render if needed.
            const updatedGroupClients = [...selectedClient.groupClients, ...createdWorkouts];
            setSelectedClient({
                ...selectedClient,
                groupClients: updatedGroupClients
            });

            setShowAddClientsModal(false);
            setSelectedClientsToAdd([]);
            setAddClientsSearchTerm('');
            
            alert(`Successfully added ${createdWorkouts.length} client(s) to the group session`);
        } catch (error) {
            console.error('Error adding clients to group session:', error);
            alert(`Failed to add clients to group session: ${error.message || 'Please try again.'}`);
        }
    };

    const handleLoadTemplate = (template) => {
        console.log('Loading template:', template, 'Current selectedClient:', selectedClient?.name);
        if (!template || !template.exercises) {
            console.error('Invalid template:', template);
            alert('Selected template is invalid or has no exercises');
            return;
        }
        setSelectedTemplate(template);
        setShowWorkoutLibrary(false);
        // Template will be loaded when client is selected
        // If a client is already selected, the template will load via initialExercises prop
        // The key prop on WorkoutBuilder will force a re-render when template changes
    };

    const handleAddTemplateToDate = (template) => {
        console.log('Adding template to date:', selectedDate, template.name);
        if (!template || !template.exercises) {
            console.error('Invalid template:', template);
            alert('Selected template is invalid or has no exercises');
            return;
        }
        
        // If there's only one client, automatically add the workout
        if (clients.length === 1) {
            const client = clients[0];
            handleAddWorkoutFromTemplate(template, client);
            return;
        }
        
        // If multiple clients, set template and close library
        // The template will be loaded when they select a client
        setSelectedTemplate(template);
        setShowWorkoutLibrary(false);
        // The template is now set and will load when a client is selected
    };

    const handleAddWorkoutFromTemplate = async (template, client) => {
        try {
            if (!template || !template.exercises || !client || !selectedDate) {
                console.error('Missing required data for adding workout from template');
                return;
            }

            // Create a deep copy of exercises
            const exercisesCopy = template.exercises.map(ex => ({
                ...ex,
                sets: ex.sets ? ex.sets.map(set => ({ ...set })) : []
            }));

            // Get current time
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const timeStr = `${hours}:${minutes}`;

            const workoutData = {
                date: selectedDate,
                clientId: client.id,
                exercises: exercisesCopy,
                time: timeStr,
                isGroup: false,
            };

            await onCreateWorkout(workoutData);
            setShowWorkoutLibrary(false);
            setSelectedTemplate(null);
            
            alert(`Workout "${template.name}" added to ${client.name} for ${formatDateDisplay(selectedDate)}!`);
        } catch (error) {
            console.error('Error adding workout from template:', error);
            alert('Failed to add workout. Please try again.');
        }
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (selectedClient) {
        const isGroupSession = selectedClient.isGroupSession && selectedClient.groupClients && selectedClient.groupClients.length > 0;
        const currentClientIndex = isGroupSession ? groupClientIndex : -1;
        const totalClients = isGroupSession ? selectedClient.groupClients.length : 1;
        
        // Find existing workout for current client
        // Also check groupSessionId if this is a group session to ensure we get the right one
        const existingWorkoutForClient = existingWorkouts.find(w => {
            const clientMatches = w.clientId === selectedClient.id;
            const dateMatches = w.date === selectedDate;
            
            // For group sessions, also verify groupSessionId matches if present
            if (isGroupSession && selectedClient.groupSessionId) {
                return clientMatches && dateMatches && w.groupSessionId === selectedClient.groupSessionId;
            }
            
            return clientMatches && dateMatches;
        });

        // Debug logging
        if (isGroupSession) {
            console.log('Group Session Info:', {
                isGroupSession,
                currentClientIndex,
                totalClients,
                groupClients: selectedClient.groupClients,
                clientName: selectedClient.name
            });
        }

        // Create a key that changes when template or client changes to force re-render
        const workoutBuilderKey = `${selectedClient?.id}-${selectedTemplate?.id || 'no-template'}-${currentClientIndex}`;

        return (
            <>
                <WorkoutBuilder
                    key={workoutBuilderKey}
                    isOpen={isOpen}
                    onClose={() => {
                        setSelectedTemplate(null); // Clear template when closing
                        handleClose();
                    }}
                    onBack={() => {
                        // Don't clear template when going back in group - let it persist for all clients
                        if (isGroupSession && currentClientIndex > 0) {
                            handlePreviousClientInGroup();
                        } else {
                            setSelectedTemplate(null); // Clear template when going back to client selection
                            handleBack();
                        }
                    }}
                selectedDate={selectedDate}
                sessionTime={sessionTime}
                onTimeChange={(newTime) => {
                    setSessionTime(newTime);
                    // For group sessions, update all workouts in the group to have the same time
                    if (isGroupSession && selectedClient?.groupSessionId) {
                        const groupWorkouts = workouts.filter(w => 
                            w.groupSessionId === selectedClient.groupSessionId && 
                            w.date === selectedDate
                        );
                        
                        // Update all workouts in the group to have the same time
                        groupWorkouts.forEach(async (workout) => {
                            if (workout.time !== newTime) {
                                try {
                                    await onUpdateWorkout(workout.id, {
                                        ...workout,
                                        time: newTime
                                    });
                                } catch (error) {
                                    console.error(`Failed to update time for workout ${workout.id}:`, error);
                                }
                            }
                        });
                    }
                }}
                client={selectedClient}
                    groupClients={null} // Don't pass groupClients - each client gets their own builder
                    isGroupSession={isGroupSession}
                    groupClientIndex={currentClientIndex}
                    totalGroupClients={totalClients}
                    exercises={exercises}
                    workouts={workouts}
                    existingWorkout={selectedTemplate ? null : existingWorkoutForClient}
                    onCreateWorkout={isGroupSession ? handleGroupWorkoutSave : onCreateWorkout}
                    onUpdateWorkout={isGroupSession ? handleGroupWorkoutSave : onUpdateWorkout}
                    onDeleteWorkout={onDeleteWorkout}
                    onNavigateToClient={isGroupSession ? navigateToClientIndex : null}
                    onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                    workoutTemplates={workoutTemplates}
                    initialExercises={selectedTemplate && selectedTemplate.exercises ? selectedTemplate.exercises : null}
                    onCreatePersonalBest={onCreatePersonalBest}
                    onDeletePersonalBest={onDeletePersonalBest}
                    onAddClientsToGroup={isGroupSession ? handleAddClientsToGroup : null}
                    clients={clients}
                />
                
                {/* Add Clients to Group Modal - rendered here so it's available when WorkoutBuilder is shown */}
                <Modal 
                    isOpen={showAddClientsModal} 
                    onClose={() => {
                        setShowAddClientsModal(false);
                        setSelectedClientsToAdd([]);
                        setAddClientsSearchTerm('');
                    }} 
                    title="Add Clients to Group Session"
                    size="md"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-200">
                            Select clients to add to this group session. Clients already in the group are excluded.
                        </p>

                        {selectedClient?.groupClients && (
                            <div className="glass rounded-lg p-3">
                                <p className="text-xs text-gray-200 mb-2">Current clients in group:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedClient.groupClients.map(c => (
                                        <span 
                                            key={c.id}
                                            className="px-2 py-1 bg-teal-600/30 text-teal-300 rounded text-xs"
                                        >
                                            {c.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            placeholder="Search clients..."
                            value={addClientsSearchTerm}
                            onChange={(e) => setAddClientsSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400"
                        />

                        {(() => {
                            // Filter out clients already in the group
                            const existingClientIds = selectedClient?.groupClients?.map(c => c.id) || [];
                            const availableClients = clients.filter(c => !existingClientIds.includes(c.id));
                            const filteredAvailableClients = availableClients.filter(client =>
                                client.name.toLowerCase().includes(addClientsSearchTerm.toLowerCase())
                            );

                            if (availableClients.length === 0) {
                                return (
                                    <div className="text-center py-8">
                                        <p className="text-gray-200">All clients are already in this group session.</p>
                                    </div>
                                );
                            }

                            if (filteredAvailableClients.length === 0) {
                                return (
                                    <div className="text-center py-8">
                                        <p className="text-gray-200">No available clients match your search.</p>
                                    </div>
                                );
                            }

                            return (
                                <>
                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {filteredAvailableClients.map(client => {
                                            const isSelected = selectedClientsToAdd.some(c => c.id === client.id);
                                            
                                            return (
                                                <button
                                                    key={client.id}
                                                    type="button"
                                                    onClick={() => handleClientToggleForAdd(client)}
                                                    className={`w-full text-left px-4 py-3 glass glass-hover rounded-lg transition-all ${
                                                        isSelected 
                                                            ? 'ring-2 ring-teal-500 bg-teal-600/20' 
                                                            : ''
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                            isSelected 
                                                                ? 'bg-teal-600 border-teal-600' 
                                                                : 'border-gray-500'
                                                        }`}>
                                                            {isSelected && (
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-semibold text-white">{client.name}</p>
                                                            {client.email && (
                                                                <p className="text-sm text-gray-200">{client.email}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {selectedClientsToAdd.length > 0 && (
                                        <div className="pt-4 border-t border-gray-700">
                                            <Button
                                                variant="group"
                                                onClick={handleConfirmAddClients}
                                                className="w-full"
                                                icon={
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                    </svg>
                                                }
                                            >
                                                Add {selectedClientsToAdd.length} client{selectedClientsToAdd.length !== 1 ? 's' : ''} to Group
                                            </Button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                </Modal>
            </>
        );
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Select Client" size="md">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <div className="glass rounded-lg p-3">
                        <p className="text-sm text-gray-200">Date</p>
                        <p className="text-white font-semibold">{formatDateDisplay(selectedDate)}</p>
                    </div>
                    <div className="glass rounded-lg p-3">
                        <label htmlFor="session-time" className="block text-sm text-gray-200 mb-1">
                            Session Time
                        </label>
                        <TimeInput24Hour
                            id="session-time"
                            value={sessionTime}
                            onChange={(e) => setSessionTime(e.target.value)}
                            step={60}
                            className="w-full"
                        />
                    </div>
                </div>

                {/* Mode Selection */}
                <div className="flex gap-2">
                    <Button
                        variant={!isGroupMode ? "primary" : "secondary"}
                        onClick={() => setIsGroupMode(false)}
                        className="flex-1"
                    >
                        Single Client
                    </Button>
                    <Button
                        variant={isGroupMode ? "group" : "secondary"}
                        onClick={handleGroupModeToggle}
                        className="flex-1"
                        icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        }
                    >
                        Small Group
                    </Button>
                </div>



                {existingWorkouts.length > 0 && (() => {
                    // Group workouts by groupSessionId to avoid duplicates
                    const groupedWorkouts = new Map();
                    const processedGroupIds = new Set();
                    
                    existingWorkouts.forEach(workout => {
                        // Check if this is a group session
                        if (workout.groupSessionId) {
                            // Only process this group once
                            if (!processedGroupIds.has(workout.groupSessionId)) {
                                processedGroupIds.add(workout.groupSessionId);
                                // Find all workouts in this group
                                const groupWorkouts = existingWorkouts.filter(w => 
                                    w.groupSessionId === workout.groupSessionId
                                );
                                // Use the first workout as the representative, but store all group info
                                groupedWorkouts.set(workout.groupSessionId, {
                                    workout: groupWorkouts[0], // Use first workout as representative
                                    groupWorkouts: groupWorkouts,
                                    isGroup: true
                                });
                            }
                        } else if (workout.isGroup && workout.clientIds) {
                            // Legacy format - treat as group
                            const legacyKey = `legacy-${workout.id}`;
                            if (!processedGroupIds.has(legacyKey)) {
                                processedGroupIds.add(legacyKey);
                                groupedWorkouts.set(legacyKey, {
                                    workout: workout,
                                    groupWorkouts: [workout],
                                    isGroup: true
                                });
                            }
                        } else {
                            // Single client workout - add individually
                            groupedWorkouts.set(workout.id, {
                                workout: workout,
                                groupWorkouts: [workout],
                                isGroup: false
                            });
                        }
                    });
                    
                    const uniqueWorkouts = Array.from(groupedWorkouts.values());
                    
                    // Sort workouts by time (early to late)
                    uniqueWorkouts.sort((a, b) => {
                        const timeA = a.workout.time || '';
                        const timeB = b.workout.time || '';
                        
                        // Workouts without time go to the end
                        if (!timeA && !timeB) return 0;
                        if (!timeA) return 1;
                        if (!timeB) return -1;
                        
                        // Compare times (HH:MM format)
                        return timeA.localeCompare(timeB);
                    });
                    
                    return (
                        <div className="glass rounded-lg p-4">
                            <p className="text-sm text-gray-200 mb-2">Existing workouts on this date:</p>
                            <div className="space-y-2">
                                {uniqueWorkouts.map(({ workout, groupWorkouts, isGroup }) => {
                                    let clientName = 'Unknown Client';
                                    let totalExercises = 0;
                                    
                                    if (isGroup) {
                                        // Group session - aggregate information
                                        const groupClientIds = [...new Set(groupWorkouts.map(w => w.clientId))];
                                        const groupClients = groupClientIds
                                            .map(id => clients.find(c => c.id === id))
                                            .filter(c => c);
                                        clientName = groupClients.length > 0
                                            ? `${groupClients.length} clients: ${groupClients.map(c => c.name).join(', ')}`
                                            : 'Group Session';
                                        // Sum exercises from all workouts in group (or use first workout's count)
                                        totalExercises = groupWorkouts[0]?.exercises?.length || 0;
                                    } else {
                                        // Single client workout
                                        const client = clients.find(c => c.id === workout.clientId);
                                        clientName = client?.name || 'Unknown Client';
                                        totalExercises = workout.exercises?.length || 0;
                                    }
                                    
                                    return (
                                        <button
                                            key={workout.id}
                                            onClick={async () => {
                                                if (workout.time) {
                                                    setSessionTime(workout.time);
                                                }
                                                // Check for group session - if workout has groupSessionId, it's a group session
                                                if (workout.groupSessionId) {
                                                    // Find all workouts in this group session
                                                    const sessionId = workout.groupSessionId;
                                                    const allGroupWorkouts = workouts.filter(w => 
                                                        w.groupSessionId === sessionId &&
                                                        w.date === selectedDate
                                                    );
                                                    const groupClientIds = [...new Set(allGroupWorkouts.map(w => w.clientId))];
                                                    const groupClients = groupClientIds
                                                        .map(id => clients.find(c => c.id === id))
                                                        .filter(c => c);
                                                    
                                                    console.log('Opening group session for editing:', {
                                                        sessionId,
                                                        groupWorkoutsCount: allGroupWorkouts.length,
                                                        groupClientsCount: groupClients.length,
                                                        clientNames: groupClients.map(c => c.name)
                                                    });
                                                    
                                                    if (groupClients.length > 0) {
                                                        // Set up group session properly with all clients
                                                        // Start with the first client, but include all in groupClients
                                                        setGroupClientIndex(0); // Start at first client
                                                        setSelectedClient({ 
                                                            ...groupClients[0], 
                                                            groupClients: groupClients, // Include all clients
                                                            isGroupSession: true, // Mark as group session
                                                            groupSessionId: sessionId // Preserve group session ID
                                                        });
                                                    }
                                                } else if (workout.clientId) {
                                                    const client = clients.find(c => c.id === workout.clientId);
                                                    if (client) {
                                                        handleClientSelect(client);
                                                    }
                                                }
                                            }}
                                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                                isGroup 
                                                    ? 'bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/30' 
                                                    : 'bg-purple-600/30 hover:bg-purple-600/50'
                                            }`}
                                        >
                                            <p className="font-semibold text-white">{clientName}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-100">
                                                <span>{totalExercises} exercise{totalExercises !== 1 ? 's' : ''}</span>
                                                {workout.time && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{formatTime24Hour(workout.time)}</span>
                                                    </>
                                                )}
                                                {isGroup && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="text-blue-400">Group</span>
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}

                <div>
                    <p className="text-sm text-gray-200 mb-3">
                        {isGroupMode 
                            ? `Select multiple clients for group session (${selectedClients.length} selected):`
                            : existingWorkouts.length > 0 
                                ? 'Or select a client to add a new workout:' 
                                : 'Select a client:'
                        }
                    </p>

                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 text-white placeholder-gray-400 mb-3 ${
                            isGroupMode ? 'focus:ring-teal-500' : 'focus:ring-purple-500'
                        }`}
                    />

                    {clients.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-200 mb-4">No clients found. Add clients first to schedule workouts.</p>
                            <Button onClick={handleClose} variant="secondary">
                                Close
                            </Button>
                        </div>
                    ) : filteredClients.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-200">No clients match your search.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {filteredClients.map(client => {
                                    const isSelected = isGroupMode 
                                        ? selectedClients.some(c => c.id === client.id)
                                        : false;
                                    
                                    return (
                                        <button
                                            key={client.id}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleClientSelect(client);
                                            }}
                                            className={`w-full text-left px-4 py-3 glass glass-hover rounded-lg transition-all ${
                                                isSelected 
                                                    ? isGroupMode 
                                                        ? 'ring-2 ring-teal-500 bg-teal-600/20' 
                                                        : 'ring-2 ring-purple-500 bg-purple-600/20'
                                                    : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isGroupMode && (
                                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                                        isSelected 
                                                            ? 'bg-teal-600 border-teal-600' 
                                                            : 'border-gray-500'
                                                    }`}>
                                                        {isSelected && (
                                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white">{client.name}</p>
                                                    {client.email && (
                                                        <p className="text-sm text-gray-200">{client.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {isGroupMode && selectedClients.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-700">
                                    <Button
                                        variant="group"
                                        onClick={handleContinueWithGroup}
                                        className="w-full"
                                        icon={
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        }
                                    >
                                        Continue with {selectedClients.length} client{selectedClients.length !== 1 ? 's' : ''}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Workout Library Modal */}
            <WorkoutLibrary
                isOpen={showWorkoutLibrary}
                onClose={() => setShowWorkoutLibrary(false)}
                workoutTemplates={workoutTemplates}
                exercises={exercises}
                selectedDate={selectedDate}
                onSelectTemplate={(template) => {
                    console.log('Template selected in WorkoutLibrary:', template);
                    handleLoadTemplate(template);
                    // If client is already selected, the template will be loaded automatically
                    // If no client selected, user needs to select one after choosing template
                }}
                onAddToDate={handleAddTemplateToDate}
                onDeleteTemplate={onDeleteWorkoutTemplate}
                onUpdateTemplate={onUpdateWorkoutTemplate}
                onCreateWorkoutTemplate={onCreateWorkoutTemplate}
            />
        </Modal>
    );
};
