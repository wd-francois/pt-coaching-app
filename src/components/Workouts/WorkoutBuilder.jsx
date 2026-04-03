import { useState, useEffect, useMemo } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { TimeInput24Hour } from '../UI/TimeInput24Hour';

export const WorkoutBuilder = ({
    isOpen,
    onClose,
    onBack,
    selectedDate = null,
    sessionTime = '',
    onTimeChange = null,
    client = null,
    isGroupSession = false,
    groupClientIndex = -1,
    totalGroupClients = 1,
    exercises,
    workouts = [],
    existingWorkout,
    onCreateWorkout,
    onUpdateWorkout,
    onDeleteWorkout,
    onNavigateToClient = null,
    onCreateWorkoutTemplate = null,
    workoutTemplates = [],
    initialExercises = null,
    isLibraryMode = false,
    onUpdateWorkoutTemplate = null,
    onCreatePersonalBest = null,
    onDeletePersonalBest = null,
    onAddClientsToGroup = null,
    clients = [],
}) => {
    const [workoutExercises, setWorkoutExercises] = useState([]); // Array of exercises for this client
    const [expandedExercises, setExpandedExercises] = useState(new Set()); // Track which exercises are expanded
    const [showExerciseSelector, setShowExerciseSelector] = useState(false);
    const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);
    const [showClientWorkoutsSelector, setShowClientWorkoutsSelector] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedEquipmentTags, setSelectedEquipmentTags] = useState([]);
    const [saving, setSaving] = useState(false);
    const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [personalBests, setPersonalBests] = useState([]); // Track Personal Bests for current client
    const [nextSupersetGroupId, setNextSupersetGroupId] = useState(1); // Track next superset group ID
    const [draggedIndex, setDraggedIndex] = useState(null); // Track which exercise is being dragged
    const [dragOverIndex, setDragOverIndex] = useState(null); // Track which position is being dragged over
    const [sessionNotes, setSessionNotes] = useState(''); // Session notes for the workout

    // Load Personal Bests for the current client
    useEffect(() => {
        if (client?.id) {
            try {
                const stored = localStorage.getItem(`personalBests_${client.id}`);
                const pbs = stored ? JSON.parse(stored) : [];
                setPersonalBests(pbs);
            } catch (error) {
                console.error('Error loading Personal Bests:', error);
                setPersonalBests([]);
            }
        } else {
            setPersonalBests([]);
        }
    }, [client?.id]);

    // Debug logging for group session
    useEffect(() => {
        if (isGroupSession) {
            console.log('WorkoutBuilder Group Session Props:', {
                isGroupSession,
                groupClientIndex,
                totalGroupClients,
                clientName: client?.name,
                groupClients: client?.groupClients,
                hasGroupClients: !!client?.groupClients,
                groupClientsLength: client?.groupClients?.length
            });
        }
    }, [isGroupSession, groupClientIndex, totalGroupClients, client]);

    useEffect(() => {
        console.log('WorkoutBuilder useEffect triggered:', {
            hasInitialExercises: !!initialExercises,
            initialExercisesLength: initialExercises?.length,
            initialExercisesType: Array.isArray(initialExercises),
            hasExistingWorkout: !!existingWorkout,
            clientId: client?.id,
            existingWorkoutClientId: existingWorkout?.clientId
        });

        // Priority: initialExercises (from template) > existingWorkout > reset
        if (initialExercises && Array.isArray(initialExercises) && initialExercises.length > 0) {
            console.log('Loading exercises from template:', initialExercises);
            // Load exercises from template - create deep copy
            const templateExercises = initialExercises.map(ex => {
                // Ensure each exercise has the required structure
                if (!ex.exerciseId) {
                    console.warn('Template exercise missing exerciseId:', ex);
                    return null;
                }
                return {
                    exerciseId: ex.exerciseId,
                    sets: ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0 
                        ? ex.sets.map(set => ({ ...set }))
                        : [{ reps: '', load: '' }], // Default set if missing
                    notes: ex.notes || '',
                    supersetGroup: ex.supersetGroup || null, // Preserve superset group if exists
                };
            }).filter(ex => ex !== null); // Remove any invalid exercises
            
            if (templateExercises.length > 0) {
                setWorkoutExercises(templateExercises);
                
                // Update nextSupersetGroupId to be higher than any existing superset group
                const maxGroupId = templateExercises.reduce((max, ex) => {
                    return ex.supersetGroup !== null && ex.supersetGroup > max ? ex.supersetGroup : max;
                }, 0);
                if (maxGroupId > 0) {
                    setNextSupersetGroupId(maxGroupId + 1);
                }
                
                console.log('Successfully loaded', templateExercises.length, 'exercises from template');
            } else {
                console.error('No valid exercises found in template');
            setWorkoutExercises([]);
            }
            // Reset when loading template
            setSessionNotes('');
        } else if (existingWorkout) {
            // Check if this is a template (library mode) or a regular workout
            const isTemplate = existingWorkout.isTemplate || isLibraryMode;
            const isForCurrentClient = existingWorkout.clientId === client?.id;
            
            // Load session notes from existing workout (only for regular workouts, not templates)
            if (!isTemplate && existingWorkout.notes) {
                setSessionNotes(existingWorkout.notes);
            } else {
                setSessionNotes('');
            }
            
            // Load if it's a template OR if it's for the current client
            if (isTemplate || isForCurrentClient) {
                console.log('Loading existing workout:', isTemplate ? 'template' : 'for client');
                // Load existing workout - migrate old format to new format if needed and create deep copy
                const migratedExercises = (existingWorkout.exercises || []).map(ex => {
                if (Array.isArray(ex.sets)) {
                        // Already in new format - create deep copy
                        return {
                            ...ex,
                            sets: ex.sets.map(set => ({ ...set })),
                            supersetGroup: ex.supersetGroup || null, // Preserve superset group if exists
                        };
                } else {
                    // Convert old format to new format
                    const setsArray = [];
                    for (let i = 0; i < (ex.sets || 3); i++) {
                        setsArray.push({ reps: ex.reps || '', load: ex.load || '' });
                    }
                    return {
                        exerciseId: ex.exerciseId,
                        sets: setsArray,
                        notes: ex.notes || '',
                            supersetGroup: null, // No superset for migrated exercises
                    };
                }
            });
            setWorkoutExercises(migratedExercises);
                
                // Update nextSupersetGroupId to be higher than any existing superset group
                const maxGroupId = migratedExercises.reduce((max, ex) => {
                    return ex.supersetGroup !== null && ex.supersetGroup > max ? ex.supersetGroup : max;
                }, 0);
                if (maxGroupId > 0) {
                    setNextSupersetGroupId(maxGroupId + 1);
                }
            } else {
                // Not for current client and not a template - reset
            setWorkoutExercises([]);
                setSessionNotes('');
                setShowExerciseSelector(false);
                setSearchTerm('');
                setFilterCategory('All');
                setSelectedEquipmentTags([]);
            }
        } else {
            console.log('Resetting workout exercises');
            // No existing workout for this client - reset form
            setWorkoutExercises([]);
            setSessionNotes('');
            setShowExerciseSelector(false);
            setSearchTerm('');
            setFilterCategory('All');
            setSelectedEquipmentTags([]);
        }
    }, [existingWorkout, client?.id, isGroupSession, groupClientIndex, initialExercises]);

    // Calculate exercise usage counts from workouts
    const exerciseUsageCounts = useMemo(() => {
        const counts = {};
        workouts.forEach(workout => {
            if (workout.exercises && Array.isArray(workout.exercises)) {
                workout.exercises.forEach(ex => {
                    if (ex.exerciseId) {
                        counts[ex.exerciseId] = (counts[ex.exerciseId] || 0) + 1;
                    }
                });
            }
        });
        return counts;
    }, [workouts]);

    // Color palette for different superset groups
    const supersetColors = [
        { // Orange/Yellow (original)
            bg: 'bg-gradient-to-r from-orange-500/20 to-yellow-500/20',
            border: 'border-orange-400/50',
            badge: 'bg-orange-500/30 text-orange-200 border-orange-400/50',
            button: 'bg-orange-500/30 hover:bg-orange-500/40 text-orange-200',
            buttonHover: 'hover:text-orange-400'
        },
        { // Blue/Cyan
            bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
            border: 'border-blue-400/50',
            badge: 'bg-blue-500/30 text-blue-200 border-blue-400/50',
            button: 'bg-blue-500/30 hover:bg-blue-500/40 text-blue-200',
            buttonHover: 'hover:text-blue-400'
        },
        { // Green/Teal
            bg: 'bg-gradient-to-r from-green-500/20 to-teal-500/20',
            border: 'border-green-400/50',
            badge: 'bg-green-500/30 text-green-200 border-green-400/50',
            button: 'bg-green-500/30 hover:bg-green-500/40 text-green-200',
            buttonHover: 'hover:text-green-400'
        },
        { // Purple/Pink
            bg: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20',
            border: 'border-purple-400/50',
            badge: 'bg-purple-500/30 text-purple-200 border-purple-400/50',
            button: 'bg-purple-500/30 hover:bg-purple-500/40 text-purple-200',
            buttonHover: 'hover:text-purple-400'
        },
        { // Red/Orange
            bg: 'bg-gradient-to-r from-red-500/20 to-orange-500/20',
            border: 'border-red-400/50',
            badge: 'bg-red-500/30 text-red-200 border-red-400/50',
            button: 'bg-red-500/30 hover:bg-red-500/40 text-red-200',
            buttonHover: 'hover:text-red-400'
        },
        { // Indigo/Violet
            bg: 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20',
            border: 'border-indigo-400/50',
            badge: 'bg-indigo-500/30 text-indigo-200 border-indigo-400/50',
            button: 'bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200',
            buttonHover: 'hover:text-indigo-400'
        },
    ];

    // Create a mapping of superset group IDs to color indices
    const getSupersetColor = useMemo(() => {
        const supersetGroups = new Map();
        const uniqueGroups = new Set();
        
        workoutExercises.forEach(ex => {
            if (ex.supersetGroup !== null && ex.supersetGroup !== undefined) {
                uniqueGroups.add(ex.supersetGroup);
            }
        });
        
        // Assign color indices to each unique group
        const groupArray = Array.from(uniqueGroups);
        groupArray.forEach((groupId, index) => {
            supersetGroups.set(groupId, index);
        });
        
        // Return a function to get color for a superset group
        return (groupId) => {
            if (groupId === null || groupId === undefined) return null;
            const colorIndex = supersetGroups.get(groupId);
            if (colorIndex === undefined) return null;
            return supersetColors[colorIndex % supersetColors.length];
        };
    }, [workoutExercises]);

    // Get all unique categories and equipment tags
    const categories = ['All', 'Most Used', ...new Set(exercises.map(e => e?.category).filter(cat => cat && cat !== 'Other'))];
    const allEquipmentTags = Array.from(new Set(
        exercises.flatMap(ex => 
            Array.isArray(ex?.equipment) ? ex.equipment : (ex?.equipment ? [ex.equipment] : [])
        )
    )).sort();

    const filteredExercises = useMemo(() => {
        let filtered = exercises.filter(exercise => {
        if (!exercise || !exercise.name) return false;
        
        const matchesSearch = !searchTerm || 
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exercise.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === 'All' || 
                filterCategory === 'Most Used' || 
                exercise.category === filterCategory;
        
        // Filter by equipment tags
        const matchesEquipment = selectedEquipmentTags.length === 0 || 
            selectedEquipmentTags.every(tag => {
                const exerciseEquipment = Array.isArray(exercise.equipment) 
                    ? exercise.equipment 
                    : (exercise.equipment ? [exercise.equipment] : []);
                return exerciseEquipment.includes(tag);
            });
        
        return matchesSearch && matchesCategory && matchesEquipment;
    });

        // If "Most Used" is selected, filter to only exercises that have been used and sort by usage
        if (filterCategory === 'Most Used') {
            filtered = filtered.filter(ex => exerciseUsageCounts[ex.id] > 0);
            filtered.sort((a, b) => {
                const countA = exerciseUsageCounts[a.id] || 0;
                const countB = exerciseUsageCounts[b.id] || 0;
                return countB - countA; // Sort descending (most used first)
            });
        }

        return filtered;
    }, [exercises, searchTerm, filterCategory, selectedEquipmentTags, exerciseUsageCounts]);

    const addExercise = (exercise) => {
        const newIndex = workoutExercises.length;
        setWorkoutExercises(prev => [
            ...prev,
            {
                exerciseId: exercise.id,
                sets: [
                    { reps: '', load: '' },
                    { reps: '', load: '' },
                    { reps: '', load: '' },
                ],
                notes: '',
                supersetGroup: null, // No superset by default
            }
        ]);
        // Automatically expand the newly added exercise
        setExpandedExercises(prev => new Set([...prev, newIndex]));
        setShowExerciseSelector(false);
        setSearchTerm('');
        setFilterCategory('All');
        setSelectedEquipmentTags([]);
    };

    const handleAddWorkoutFromTemplate = (template) => {
        if (!template || !template.exercises || template.exercises.length === 0) {
            alert('Selected workout has no exercises');
            return;
        }

        // Add all exercises from the template to the current workout
        const newExercises = template.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0
                ? ex.sets.map(set => ({ ...set }))
                : [{ reps: '', load: '' }],
            notes: ex.notes || '',
            supersetGroup: ex.supersetGroup || null,
        }));

        setWorkoutExercises(prev => [...prev, ...newExercises]);
        
        // Expand the newly added exercises
        const newIndices = Array.from({ length: newExercises.length }, (_, i) => workoutExercises.length + i);
        setExpandedExercises(prev => new Set([...prev, ...newIndices]));
        
        setShowWorkoutSelector(false);
    };

    const handleAddWorkoutFromClient = (workout) => {
        if (!workout || !workout.exercises || workout.exercises.length === 0) {
            alert('Selected workout has no exercises');
            return;
        }

        // Add all exercises from the client workout to the current workout
        const newExercises = workout.exercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets && Array.isArray(ex.sets) && ex.sets.length > 0
                ? ex.sets.map(set => ({ ...set }))
                : [{ reps: '', load: '' }],
            notes: ex.notes || '',
            supersetGroup: ex.supersetGroup || null,
        }));

        setWorkoutExercises(prev => [...prev, ...newExercises]);
        
        // Expand the newly added exercises
        const newIndices = Array.from({ length: newExercises.length }, (_, i) => workoutExercises.length + i);
        setExpandedExercises(prev => new Set([...prev, ...newIndices]));
        
        setShowClientWorkoutsSelector(false);
    };

    const updateExerciseNotes = (exerciseIndex, notes) => {
        setWorkoutExercises(prev => {
            const updated = [...prev];
            updated[exerciseIndex] = { ...updated[exerciseIndex], notes };
            return updated;
        });
    };

    const updateSet = (exerciseIndex, setIndex, field, value) => {
        setWorkoutExercises(prev => {
            const updated = [...prev];
            const sets = [...updated[exerciseIndex].sets];
            sets[setIndex] = { ...sets[setIndex], [field]: value };
            updated[exerciseIndex] = { ...updated[exerciseIndex], sets };
            return updated;
        });
    };

    const addSet = (exerciseIndex) => {
        setWorkoutExercises(prev => {
            const updated = [...prev];
            const lastSet = updated[exerciseIndex].sets[updated[exerciseIndex].sets.length - 1];
            updated[exerciseIndex] = {
                ...updated[exerciseIndex],
                sets: [...updated[exerciseIndex].sets, { reps: lastSet?.reps || '', load: lastSet?.load || '' }]
            };
            return updated;
        });
    };

    const removeSet = (exerciseIndex, setIndex) => {
        setWorkoutExercises(prev => {
            const updated = [...prev];
            if (updated[exerciseIndex].sets.length > 1) {
                updated[exerciseIndex] = {
                    ...updated[exerciseIndex],
                    sets: updated[exerciseIndex].sets.filter((_, i) => i !== setIndex)
                };
            }
            return updated;
        });
    };

    // Check if a set is already a Personal Best
    const isPersonalBest = (exerciseIndex, setIndex) => {
        if (!client?.id || personalBests.length === 0) return false;
        
        const exercise = workoutExercises[exerciseIndex];
        const set = exercise.sets[setIndex];
        
        if (!set.reps || !set.load) return false;
        
        return personalBests.some(pb => 
            pb.exerciseId === exercise.exerciseId &&
            pb.reps === set.reps &&
            pb.weight === set.load
        );
    };

    // Get the Personal Best ID for a set
    const getPersonalBestId = (exerciseIndex, setIndex) => {
        if (!client?.id || personalBests.length === 0) return null;
        
        const exercise = workoutExercises[exerciseIndex];
        const set = exercise.sets[setIndex];
        
        if (!set.reps || !set.load) return null;
        
        const pb = personalBests.find(pb => 
            pb.exerciseId === exercise.exerciseId &&
            pb.reps === set.reps &&
            pb.weight === set.load
        );
        
        return pb?.id || null;
    };

    const handleTogglePersonalBest = async (exerciseIndex, setIndex) => {
        if (!client) {
            alert('Unable to save Personal Best. Client information is required.');
            return;
        }

        const exercise = workoutExercises[exerciseIndex];
        const set = exercise.sets[setIndex];
        const exerciseData = exercises.find(e => e.id === exercise.exerciseId);

        if (!exerciseData) {
            alert('Exercise not found.');
            return;
        }

        if (!set.reps || !set.load) {
            alert('Please enter both reps and load before saving as Personal Best.');
            return;
        }

        const pbId = getPersonalBestId(exerciseIndex, setIndex);
        const isPB = !!pbId;

        try {
            if (isPB && onDeletePersonalBest) {
                // Remove Personal Best
                await onDeletePersonalBest(pbId, client.id);
                
                // Update local state
                setPersonalBests(prev => prev.filter(pb => pb.id !== pbId));
            } else if (!isPB && onCreatePersonalBest) {
                // Save Personal Best
                const personalBestData = {
                    exerciseId: exercise.exerciseId,
                    exerciseName: exerciseData.name,
                    weight: set.load,
                    reps: set.reps,
                    clientId: client.id,
                    date: selectedDate ? new Date(selectedDate).getTime() : Date.now(),
                    notes: exercise.notes || '',
                };

                await onCreatePersonalBest(personalBestData);
                
                // Reload Personal Bests to get the new one with ID
                const stored = localStorage.getItem(`personalBests_${client.id}`);
                const pbs = stored ? JSON.parse(stored) : [];
                setPersonalBests(pbs);
            }
            
            // Show success feedback
            const button = document.activeElement;
            if (button) {
                button.classList.add('animate-pulse');
                setTimeout(() => button.classList.remove('animate-pulse'), 500);
            }
        } catch (error) {
            console.error('Error toggling Personal Best:', error);
            alert(`Failed to ${isPB ? 'remove' : 'save'} Personal Best. Please try again.`);
        }
    };

    const removeExercise = (index) => {
        setWorkoutExercises(prev => prev.filter((_, i) => i !== index));
    };

    const moveExercise = (index, direction) => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === workoutExercises.length - 1)
        ) {
            return;
        }

        setWorkoutExercises(prev => {
            const updated = [...prev];
            const newIndex = direction === 'up' ? index - 1 : index + 1;
            [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
            return updated;
        });
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target);
        // Make the dragged element semi-transparent
        e.target.style.opacity = '0.5';
    };

    const handleDragEnd = (e) => {
        e.target.style.opacity = '';
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (draggedIndex === null || draggedIndex === index) {
            return;
        }
        
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        // Update expanded exercises set to reflect new positions before reordering
        setExpandedExercises(prev => {
            const newSet = new Set();
            const fromIndex = draggedIndex;
            const toIndex = dropIndex;
            
            prev.forEach(oldIndex => {
                if (oldIndex === fromIndex) {
                    // The dragged item moves to new position
                    newSet.add(toIndex);
                } else if (fromIndex < toIndex) {
                    // Moving down: items between fromIndex and toIndex shift up
                    if (oldIndex > fromIndex && oldIndex <= toIndex) {
                        newSet.add(oldIndex - 1);
                    } else if (oldIndex < fromIndex || oldIndex > toIndex) {
                        newSet.add(oldIndex);
                    }
                } else {
                    // Moving up: items between toIndex and fromIndex shift down
                    if (oldIndex >= toIndex && oldIndex < fromIndex) {
                        newSet.add(oldIndex + 1);
                    } else if (oldIndex < toIndex || oldIndex > fromIndex) {
                        newSet.add(oldIndex);
                    }
                }
            });
            return newSet;
        });

        setWorkoutExercises(prev => {
            const updated = [...prev];
            const draggedExercise = updated[draggedIndex];
            
            // Remove the dragged item
            updated.splice(draggedIndex, 1);
            
            // Insert at new position
            const newIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
            updated.splice(newIndex, 0, draggedExercise);
            
            return updated;
        });

        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const toggleSuperset = (exerciseIndex) => {
        console.log('toggleSuperset called for exercise index:', exerciseIndex);
        setWorkoutExercises(prev => {
            const updated = prev.map((ex, idx) => ({ ...ex })); // Create deep copy
            const exercise = updated[exerciseIndex];
            
            if (!exercise) {
                console.error('Exercise not found at index:', exerciseIndex);
                return prev;
            }
            
            // Ensure exercise has supersetGroup property
            const currentSupersetGroup = exercise.supersetGroup !== undefined ? exercise.supersetGroup : null;
            
            console.log('Current supersetGroup:', currentSupersetGroup);
            
            if (currentSupersetGroup !== null && currentSupersetGroup !== undefined) {
                // Remove from superset - find all exercises in the same group and remove them
                const groupId = currentSupersetGroup;
                console.log('Removing from superset group:', groupId);
                updated.forEach((ex, idx) => {
                    if (ex.supersetGroup === groupId) {
                        updated[idx] = { ...ex, supersetGroup: null };
                    }
                });
            } else {
                // Add to superset - check if there's an adjacent exercise in a superset
                // If previous exercise is in a superset, join that group
                // Otherwise, create a new group
                let groupId = null;
                
                if (exerciseIndex > 0) {
                    const prevEx = updated[exerciseIndex - 1];
                    if (prevEx.supersetGroup !== null && prevEx.supersetGroup !== undefined) {
                        // Join previous exercise's superset group
                        groupId = prevEx.supersetGroup;
                        console.log('Joining previous exercise superset group:', groupId);
                    }
                }
                
                if (groupId === null && exerciseIndex < updated.length - 1) {
                    const nextEx = updated[exerciseIndex + 1];
                    if (nextEx.supersetGroup !== null && nextEx.supersetGroup !== undefined) {
                        // Join next exercise's superset group
                        groupId = nextEx.supersetGroup;
                        console.log('Joining next exercise superset group:', groupId);
                    }
                }
                
                if (groupId === null) {
                    // Create new superset group - use a timestamp-based ID to avoid conflicts
                    groupId = Date.now() + Math.random();
                    console.log('Creating new superset group:', groupId);
                }
                
                updated[exerciseIndex] = { ...exercise, supersetGroup: groupId };
            }
            
            console.log('Updated exercise supersetGroup:', updated[exerciseIndex].supersetGroup);
            return updated;
        });
    };

    const handleSave = async () => {
        if (workoutExercises.length === 0) {
            alert('Please add at least one exercise');
            return;
        }

        setSaving(true);
        try {
            // Create a deep copy of exercises to ensure data integrity
            // Ensure reps and load are properly formatted (empty string or number)
            const exercisesCopy = workoutExercises.map(ex => ({
                ...ex,
                sets: ex.sets ? ex.sets.map(set => ({
                    ...set,
                    reps: set.reps === null || set.reps === undefined ? '' : set.reps,
                    load: set.load === null || set.load === undefined ? '' : set.load
                })) : []
            }));
            
            // Handle library mode (template editing)
            if (isLibraryMode && existingWorkout && onUpdateWorkoutTemplate) {
                await onUpdateWorkoutTemplate(existingWorkout.id, {
                    exercises: exercisesCopy
                });
                onClose();
                return;
            }

            // Regular workout mode - requires client and date
            if (!client || !selectedDate) {
                alert('Missing required information (client or date)');
                setSaving(false);
                return;
            }
            
            const workoutData = {
                date: selectedDate,
                clientId: client.id,
                exercises: exercisesCopy, // Use deep copy
                time: sessionTime || '',
                isGroup: isGroupSession,
                name: null, // Workout name removed
                notes: sessionNotes.trim() || null, // Session notes
            };

            // Add groupSessionId if this is part of a group
            if (isGroupSession && client.groupSessionId) {
                workoutData.groupSessionId = client.groupSessionId;
            } else if (isGroupSession) {
                // Fallback: generate group session ID if not provided
                const groupSessionId = existingWorkout?.groupSessionId || `group-${selectedDate}-${sessionTime}-${Date.now()}`;
                workoutData.groupSessionId = groupSessionId;
            }

            if (existingWorkout) {
                // For group sessions, pass both workout data and existing workout info
                if (isGroupSession) {
                    await onUpdateWorkout({ 
                        workoutData, 
                        existingWorkout: { id: existingWorkout.id } 
                    });
                } else {
                    await onUpdateWorkout(existingWorkout.id, workoutData);
                }
            } else {
                // For group sessions, pass workout data in a wrapper
                if (isGroupSession) {
                    await onCreateWorkout({ workoutData });
                } else {
                    await onCreateWorkout(workoutData);
                }
            }
            
            // Don't close for group sessions - let the parent handle navigation
            if (!isGroupSession) {
                onClose();
            }
            // For group sessions, the parent (handleGroupWorkoutSave) will handle navigation
            // The form will reset when the new client loads via useEffect
        } catch (error) {
            console.error('Error saving workout:', error);
            console.error('Error details:', {
                message: error.message,
                stack: error.stack,
                exercises: workoutExercises
            });
            alert(`Failed to save workout: ${error.message || 'Unknown error'}`);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!existingWorkout) return;

        if (window.confirm('Are you sure you want to delete this workout?')) {
            try {
                await onDeleteWorkout(existingWorkout.id);
                onClose();
            } catch (error) {
                console.error('Error deleting workout:', error);
                alert('Failed to delete workout');
            }
        }
    };

    const handleSaveToLibrary = () => {
        if (workoutExercises.length === 0) {
            alert('Please add at least one exercise before saving to library');
            return;
        }
        
        // For group sessions, show info about saving separate templates for each client
        if (isGroupSession && client?.groupSessionId && client?.groupClients) {
            const groupWorkouts = workouts.filter(w => 
                w.groupSessionId === client.groupSessionId && 
                w.date === selectedDate
            );
            const totalClients = client.groupClients.length;
            const savedClients = groupWorkouts.length;
            
            const message = `This will save separate workout templates for each client in the group session.\n\n` +
                `Total clients: ${totalClients}\n` +
                `Clients with saved workouts: ${savedClients}\n\n` +
                `Each client's exercises will be saved as a separate template named: "[Group Name] - [Client Name]"`;
            // Don't block, just inform
            console.log(message);
        }
        
        setShowSaveTemplateDialog(true);
    };

    const getClientExercisesFromGroup = (clientId) => {
        if (!isGroupSession || !client?.groupSessionId || !selectedDate) {
            return null;
        }

        // Get the workout for this specific client in the group session
        const clientWorkout = workouts.find(w => 
            w.groupSessionId === client.groupSessionId && 
            w.date === selectedDate &&
            w.clientId === clientId
        );

        if (clientWorkout && clientWorkout.exercises && Array.isArray(clientWorkout.exercises)) {
            // Return exercises from saved workout
            return clientWorkout.exercises.map(ex => ({
                ...ex,
                sets: ex.sets ? ex.sets.map(set => ({ ...set })) : []
            }));
        }

        // If no saved workout, check if this is the current client being edited
        if (clientId === client.id && workoutExercises.length > 0) {
            return workoutExercises.map(ex => ({
                ...ex,
                sets: ex.sets ? ex.sets.map(set => ({ ...set })) : []
            }));
        }

        return null;
    };

    const handleConfirmSaveTemplate = async () => {
        if (!templateName.trim()) {
            alert('Please enter a name for this workout template');
            return;
        }

        if (!onCreateWorkoutTemplate) {
            alert('Save to library is not available');
            return;
        }

        try {
            // For group sessions, save separate templates for each client
            if (isGroupSession && client?.groupSessionId && client?.groupClients) {
                const groupName = templateName.trim();
                const groupTag = `group-${client.groupSessionId}`;
                let savedCount = 0;
                let skippedCount = 0;

                // Save a template for each client in the group
                for (const groupClient of client.groupClients) {
                    const clientExercises = getClientExercisesFromGroup(groupClient.id);
                    
                    if (clientExercises && clientExercises.length > 0) {
                        // Create template name: "Group Name - Client Name"
                        const templateNameForClient = `${groupName} - ${groupClient.name}`;
                        
                        await onCreateWorkoutTemplate({
                            name: templateNameForClient,
                            exercises: clientExercises,
                            tags: [groupTag, 'group-session'], // Tag to link templates together
                        });
                        savedCount++;
                    } else {
                        skippedCount++;
                        console.warn(`No exercises found for client ${groupClient.name} in group session`);
                    }
                }

                if (savedCount === 0) {
                    alert('No exercises found in group session to save');
                    return;
                }

                const message = savedCount > 0
                    ? `Saved ${savedCount} workout template(s) to library${skippedCount > 0 ? ` (${skippedCount} client(s) skipped - no exercises)` : ''}!`
                    : 'No exercises found to save';
                alert(message);
            } else {
                // For single client, use current exercises
                const exercisesToSave = workoutExercises.map(ex => ({
                    ...ex,
                    sets: ex.sets ? ex.sets.map(set => ({ ...set })) : []
                }));

                await onCreateWorkoutTemplate({
                    name: templateName.trim(),
                    exercises: exercisesToSave,
                    tags: [],
                });

                alert('Workout saved to library!');
            }

            setShowSaveTemplateDialog(false);
            setTemplateName('');
        } catch (error) {
            console.error('Error saving workout template:', error);
            alert('Failed to save workout to library');
        }
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr + 'T00:00:00');
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
    };

    const getExerciseName = (exerciseId) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        return exercise?.name || 'Unknown Exercise';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isLibraryMode ? "Edit Workout Template" : "Workout Builder"} size="lg">
            <div className="space-y-6">
                {/* Header Info */}
                {!isLibraryMode && (
                <div className="flex items-start justify-between">
                    <div className="grid grid-cols-3 gap-3 flex-1">
                            {client && (
                        <div className={`glass rounded-lg p-3 ${isGroupSession ? 'border border-teal-500/30 bg-teal-900/5' : ''}`}>
                            <p className="text-sm text-gray-400">Client</p>
                            <p className="text-white font-semibold text-lg">{client.name}</p>
                            {isGroupSession && groupClientIndex >= 0 && (
                                <p className="text-xs text-teal-400 mt-1">
                                    Part of group session ({groupClientIndex + 1}/{totalGroupClients})
                                </p>
                            )}
                        </div>
                            )}
                            {selectedDate && (
                        <div className="glass rounded-lg p-3">
                            <p className="text-sm text-gray-400">Date</p>
                            <p className="text-white font-semibold">{formatDateDisplay(selectedDate)}</p>
                        </div>
                            )}
                            {onTimeChange && (
                        <div className="glass rounded-lg p-3">
                            <label htmlFor="workout-time" className="block text-sm text-gray-400 mb-1">
                                Session Time
                            </label>
                                    <TimeInput24Hour
                                id="workout-time"
                                value={sessionTime || ''}
                                        onChange={(e) => onTimeChange(e.target.value)}
                                        step={60}
                                        className="w-full"
                            />
                        </div>
                            )}
                    </div>
                        {onBack && (
                    <Button onClick={onBack} variant="ghost" size="sm">
                        ← Back
                    </Button>
                        )}
                </div>
                )}
                {isLibraryMode && existingWorkout && (
                    <div className="glass rounded-lg p-4 border-2 border-purple-500/50 bg-purple-900/10">
                        <p className="text-sm text-purple-400 mb-1">Editing Template</p>
                        <p className="text-white font-semibold text-lg">{existingWorkout.name || 'Unnamed Template'}</p>
                    </div>
                )}

                {/* Group Session Progress */}
                {!isLibraryMode && isGroupSession && groupClientIndex >= 0 && client?.groupClients && (
                    <div className="glass rounded-lg p-4 border-2 border-teal-500/50 bg-teal-900/10">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm text-teal-400">Group Session Progress</p>
                                <p className="text-white font-semibold">
                                    Client {groupClientIndex + 1} of {totalGroupClients}
                                </p>
                            </div>
                            {groupClientIndex < totalGroupClients - 1 && (
                                <p className="text-sm text-teal-400">
                                    Next: {client.groupClients[groupClientIndex + 1]?.name}
                                </p>
                            )}
                        </div>
                        {/* Show all clients in the group */}
                        <div className="border-t border-teal-700/50 pt-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-teal-400">All clients in this group (click to navigate):</p>
                                {onAddClientsToGroup && (
                                    <Button
                                        onClick={onAddClientsToGroup}
                                        size="sm"
                                        variant="secondary"
                                        className="text-xs"
                                        icon={
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        }
                                    >
                                        Add Clients
                                    </Button>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {client.groupClients.map((c, idx) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            if (idx !== groupClientIndex && onNavigateToClient) {
                                                onNavigateToClient(idx);
                                            }
                                        }}
                                        disabled={idx === groupClientIndex}
                                        className={`px-2 py-1 rounded text-xs transition-all ${
                                            idx === groupClientIndex
                                                ? 'bg-teal-600 text-white ring-2 ring-teal-400 cursor-default'
                                                : idx < groupClientIndex
                                                ? 'bg-teal-600/30 text-teal-300 hover:bg-teal-600/50 cursor-pointer hover:scale-105'
                                                : 'bg-gray-700 text-gray-400 hover:bg-teal-700/30 cursor-pointer hover:scale-105'
                                        }`}
                                    >
                                        {c.name} {idx < groupClientIndex && '✓'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Exercise List */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-white">Exercises</h3>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => setShowExerciseSelector(!showExerciseSelector)}
                                size="sm"
                                icon={
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                }
                            >
                                Add Exercise
                            </Button>
                            {onCreateWorkoutTemplate && workoutTemplates && workoutTemplates.length > 0 && (
                                <Button
                                    onClick={() => setShowWorkoutSelector(true)}
                                    size="sm"
                                    variant="secondary"
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    }
                                >
                                    Add from Library
                                </Button>
                            )}
                            {workouts && workouts.length > 0 && (
                                <Button
                                    onClick={() => setShowClientWorkoutsSelector(true)}
                                    size="sm"
                                    variant="secondary"
                                    icon={
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    }
                                >
                                    Add from Client Workouts
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Exercise Selector */}
                    {showExerciseSelector && (
                        <div className="glass rounded-lg p-4 mb-4 space-y-4">
                            <input
                                type="text"
                                placeholder="Search exercises..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                            />

                            {/* Filters */}
                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs text-gray-400 mb-2">Filters</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {categories.map(cat => {
                                            const isMostUsed = cat === 'Most Used';
                                            const mostUsedCount = isMostUsed ? Object.keys(exerciseUsageCounts).length : 0;
                                            return (
                                            <button
                                                key={cat}
                                                onClick={() => setFilterCategory(cat)}
                                                    className={`px-3 py-1 rounded-full text-sm transition-all flex items-center gap-1 ${filterCategory === cat
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }`}
                                                    title={isMostUsed ? `${mostUsedCount} exercises have been used in workouts` : ''}
                                            >
                                                {cat}
                                                    {isMostUsed && mostUsedCount > 0 && (
                                                        <span className="text-xs opacity-75">({mostUsedCount})</span>
                                                    )}
                                            </button>
                                            );
                                        })}
                                        {allEquipmentTags.length > 0 && allEquipmentTags.map(tag => {
                                            const isSelected = selectedEquipmentTags.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => {
                                                        if (isSelected) {
                                                            setSelectedEquipmentTags(prev => prev.filter(t => t !== tag));
                                                        } else {
                                                            setSelectedEquipmentTags(prev => [...prev, tag]);
                                                        }
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                        {(filterCategory !== 'All' || selectedEquipmentTags.length > 0) && (
                                            <button
                                                onClick={() => {
                                                    setFilterCategory('All');
                                                    setSelectedEquipmentTags([]);
                                                }}
                                                className="px-3 py-1 rounded-full text-sm bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-all"
                                            >
                                                Clear Filters
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-64 overflow-y-auto space-y-2">
                                {exercises.length === 0 ? (
                                    <p className="text-gray-400 text-center py-4">No exercises in database. Add exercises first.</p>
                                ) : filteredExercises.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-gray-400 mb-2">No exercises match your filters.</p>
                                        <button
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilterCategory('All');
                                                setSelectedEquipmentTags([]);
                                            }}
                                            className="text-sm text-purple-400 hover:text-purple-300 underline"
                                        >
                                            Clear all filters
                                        </button>
                                    </div>
                                ) : (
                                    filteredExercises.map(exercise => (
                                        <button
                                            key={exercise.id}
                                            onClick={() => addExercise(exercise)}
                                            className="w-full text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-white">{exercise.name}</p>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-purple-600/30 text-purple-300">
                                                            {exercise.category}
                                                        </span>
                                                        {exercise.equipment && Array.isArray(exercise.equipment) && exercise.equipment.length > 0 && (
                                                            exercise.equipment.map((equip, idx) => (
                                                                <span key={idx} className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-600/30 text-blue-300">
                                                                    {equip}
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* Workout Exercises */}
                    {workoutExercises.length === 0 ? (
                        <div className="glass rounded-lg p-8 text-center">
                            <p className="text-gray-400">No exercises added yet. Click "Add Exercise" to get started.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workoutExercises.map((workoutEx, exerciseIndex) => {
                                const isExpanded = expandedExercises.has(exerciseIndex);
                                
                                const toggleExercise = () => {
                                    setExpandedExercises(prev => {
                                        const newSet = new Set(prev);
                                        if (newSet.has(exerciseIndex)) {
                                            newSet.delete(exerciseIndex);
                                        } else {
                                            newSet.add(exerciseIndex);
                                        }
                                        return newSet;
                                    });
                                };

                                const isSuperset = workoutEx.supersetGroup !== null && workoutEx.supersetGroup !== undefined;
                                const supersetColor = getSupersetColor(workoutEx.supersetGroup);
                                
                                const isDragging = draggedIndex === exerciseIndex;
                                const isDragOver = dragOverIndex === exerciseIndex;
                                
                                return (
                                    <div 
                                        key={exerciseIndex} 
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, exerciseIndex)}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, exerciseIndex)}
                                        onDragLeave={handleDragLeave}
                                        onDrop={(e) => handleDrop(e, exerciseIndex)}
                                        className={`rounded-lg overflow-hidden transition-all cursor-move ${
                                            isDragging
                                                ? 'opacity-50 scale-95'
                                                : isDragOver
                                                ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-900 scale-105'
                                                : ''
                                        } ${
                                            isSuperset && supersetColor
                                                ? `${supersetColor.bg} border-2 ${supersetColor.border}` 
                                                : 'glass'
                                        }`}
                                    >
                                        {/* Exercise Header - Clickable */}
                                        <div className="flex items-center gap-3 p-4">
                                        {/* Drag Handle */}
                                        <div className="cursor-move flex-shrink-0" title="Drag to reorder">
                                            <svg className="w-5 h-5 text-gray-400 hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                            </svg>
                                        </div>
                                        
                                        {/* Reorder buttons */}
                                        <div className="flex flex-col gap-1">
                                            <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveExercise(exerciseIndex, 'up');
                                                    }}
                                                disabled={exerciseIndex === 0}
                                                aria-label="Move exercise up"
                                                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                </svg>
                                            </button>
                                            <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        moveExercise(exerciseIndex, 'down');
                                                    }}
                                                disabled={exerciseIndex === workoutExercises.length - 1}
                                                aria-label="Move exercise down"
                                                className="p-1 hover:bg-white/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>
                                        </div>

                                            {/* Exercise Name - Clickable to expand/collapse */}
                                            <button
                                                onClick={toggleExercise}
                                                className="flex-1 flex items-center justify-between text-left hover:bg-white/5 rounded-lg px-3 py-2 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isSuperset && supersetColor && (
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${supersetColor.badge}`}>
                                                            SUPERSET
                                                        </span>
                                                    )}
                                                <h4 className="font-semibold text-white">{getExerciseName(workoutEx.exerciseId)}</h4>
                                                    <span className="text-sm text-gray-400">{workoutEx.sets.length} set{workoutEx.sets.length !== 1 ? 's' : ''}</span>
                                            </div>
                                                <svg
                                                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {/* Superset Toggle Button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    toggleSuperset(exerciseIndex);
                                                }}
                                                aria-label={isSuperset ? "Remove from superset" : "Add to superset"}
                                                className={`p-2 rounded-lg transition-colors ${
                                                    isSuperset && supersetColor
                                                        ? `${supersetColor.button}` 
                                                        : 'hover:bg-white/10 text-gray-400 hover:text-orange-400'
                                                }`}
                                                title={isSuperset ? "Remove from superset" : "Add to superset"}
                                            >
                                                <svg className="w-5 h-5" fill={isSuperset ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                </svg>
                                            </button>

                                            {/* Delete Exercise button */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeExercise(exerciseIndex);
                                                }}
                                                aria-label={`Remove ${getExerciseName(workoutEx.exerciseId)} from workout`}
                                                className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        {/* Expanded Exercise Details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 space-y-3 border-t border-white/10 pt-4">
                                            {/* Sets Table */}
                                            <div className="space-y-2">
                                                <div className="grid grid-cols-12 gap-2 text-xs text-gray-400 px-2">
                                                    <div className="col-span-2">Set</div>
                                                    <div className="col-span-4">Reps</div>
                                                        <div className="col-span-4">Load</div>
                                                        <div className="col-span-2"></div>
                                                </div>

                                                {workoutEx.sets.map((set, setIndex) => (
                                                    <div key={setIndex} className="grid grid-cols-12 gap-2 items-center">
                                                        <div className="col-span-2">
                                                            <span className="text-white font-medium px-2">{setIndex + 1}</span>
                                                        </div>
                                                        <div className="col-span-4">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={set.reps === '' || set.reps === null || set.reps === undefined ? '' : (typeof set.reps === 'number' ? set.reps : parseInt(set.reps, 10) || '')}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    // Handle empty string - store as empty string for consistency
                                                                    if (value === '' || value === null || value === undefined) {
                                                                        updateSet(exerciseIndex, setIndex, 'reps', '');
                                                                    } else {
                                                                        // Parse as integer
                                                                        const numValue = parseInt(value, 10);
                                                                        if (!isNaN(numValue) && numValue >= 0) {
                                                                            updateSet(exerciseIndex, setIndex, 'reps', numValue);
                                                                        } else {
                                                                            // Invalid input, set to empty
                                                                            updateSet(exerciseIndex, setIndex, 'reps', '');
                                                                        }
                                                                    }
                                                                }}
                                                                onBlur={(e) => {
                                                                    // Ensure value is valid on blur
                                                                    const value = e.target.value;
                                                                    if (value === '' || value === null || value === undefined) {
                                                                        updateSet(exerciseIndex, setIndex, 'reps', '');
                                                                    } else {
                                                                        const numValue = parseInt(value, 10);
                                                                        if (isNaN(numValue) || numValue < 1) {
                                                                            updateSet(exerciseIndex, setIndex, 'reps', '');
                                                                        } else {
                                                                            updateSet(exerciseIndex, setIndex, 'reps', numValue);
                                                                        }
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                                                            />
                                                        </div>
                                                            <div className="col-span-4">
                                                            <input
                                                                type="text"
                                                                value={set.load}
                                                                onChange={(e) => updateSet(exerciseIndex, setIndex, 'load', e.target.value)}
                                                                placeholder=""
                                                                className="w-full px-3 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500"
                                                            />
                                                        </div>
                                                            <div className="col-span-2 flex items-center gap-1 justify-end">
                                                                {client && (onCreatePersonalBest || onDeletePersonalBest) && (
                                                                    <button
                                                                        onClick={() => handleTogglePersonalBest(exerciseIndex, setIndex)}
                                                                        aria-label={isPersonalBest(exerciseIndex, setIndex) ? `Remove Personal Best for set ${setIndex + 1}` : `Save set ${setIndex + 1} as Personal Best`}
                                                                        className="p-1 hover:bg-yellow-500/20 rounded transition-colors"
                                                                        title={isPersonalBest(exerciseIndex, setIndex) ? "Remove Personal Best" : "Save as Personal Best"}
                                                                    >
                                                                        {isPersonalBest(exerciseIndex, setIndex) ? (
                                                                            // Filled star for Personal Best
                                                                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                            </svg>
                                                                        ) : (
                                                                            // Outlined star for normal set
                                                                            <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                                                            </svg>
                                                                        )}
                                                                    </button>
                                                                )}
                                                            {workoutEx.sets.length > 1 && (
                                                                <button
                                                                    onClick={() => removeSet(exerciseIndex, setIndex)}
                                                                    aria-label={`Remove set ${setIndex + 1}`}
                                                                    className="p-1 hover:bg-red-500/20 rounded transition-colors"
                                                                >
                                                                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Set Button */}
                                                <Button
                                                    onClick={() => addSet(exerciseIndex)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full"
                                                    icon={
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                        </svg>
                                                    }
                                                >
                                                    Add Set
                                                </Button>
                                            </div>

                                            {/* Notes */}
                                            <div>
                                                <label className="block text-xs text-gray-400 mb-1">Notes</label>
                                                <textarea
                                                        value={workoutEx.notes || ''}
                                                    onChange={(e) => updateExerciseNotes(exerciseIndex, e.target.value)}
                                                    placeholder="Additional notes..."
                                                    rows={2}
                                                    className="w-full px-3 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 resize-none"
                                                />
                                            </div>
                                        </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Session Notes */}
                {!isLibraryMode && (
                    <div className="glass rounded-lg p-4">
                        <label htmlFor="session-notes" className="block text-sm font-medium text-gray-300 mb-2">
                            Session Notes
                        </label>
                        <textarea
                            id="session-notes"
                            value={sessionNotes}
                            onChange={(e) => setSessionNotes(e.target.value)}
                            placeholder="Add notes about this session (e.g., client feedback, progress, modifications, etc.)..."
                            rows={4}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-500 resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            These notes will be saved with the workout and can be viewed later
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                    <Button 
                        onClick={handleSave} 
                        variant={isGroupSession ? "group" : "primary"}
                        loading={saving} 
                        className="flex-1"
                    >
                        {isLibraryMode 
                            ? 'Update Template'
                            : isGroupSession 
                            ? (groupClientIndex < totalGroupClients - 1 ? 'Save & Next Client' : 'Save & Finish')
                            : (existingWorkout ? 'Update Workout' : 'Save Workout')
                        }
                    </Button>
                    {!isLibraryMode && onCreateWorkoutTemplate && workoutExercises.length > 0 && (
                        <Button 
                            onClick={handleSaveToLibrary} 
                            variant="ghost"
                            title={
                                isGroupSession && client?.groupSessionId
                                    ? "Save separate workout templates for each client in this group session to the library"
                                    : "Save this workout to the library for reuse"
                            }
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                            Save to Library
                        </Button>
                    )}
                    {existingWorkout && !isLibraryMode && (
                        <Button onClick={handleDelete} variant="danger">
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            {/* Workout Selector Modal */}
            {showWorkoutSelector && (
                <Modal
                    isOpen={showWorkoutSelector}
                    onClose={() => setShowWorkoutSelector(false)}
                    title="Select Workout"
                    size="lg"
                >
                    <div className="space-y-4">
                        {workoutTemplates.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-400">No workouts available in library</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                {workoutTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        onClick={() => handleAddWorkoutFromTemplate(template)}
                                        className="w-full text-left glass rounded-lg p-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-white mb-2">
                                                    {template.name || 'Unnamed Workout'}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {template.exercises?.slice(0, 5).map((ex, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded"
                                                        >
                                                            {getExerciseName(ex.exerciseId)}
                                                        </span>
                                                    ))}
                                                    {template.exercises?.length > 5 && (
                                                        <span className="text-xs text-gray-400">
                                                            +{template.exercises.length - 5} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Client Workouts Selector Modal */}
            {showClientWorkoutsSelector && (
                <Modal
                    isOpen={showClientWorkoutsSelector}
                    onClose={() => setShowClientWorkoutsSelector(false)}
                    title={client ? `Select Workout from ${client.name}` : "Select Workout from Clients"}
                    size="lg"
                >
                    <div className="space-y-4">
                        {(() => {
                            // Filter workouts by client if client is selected, otherwise show all workouts
                            const filteredWorkouts = client 
                                ? workouts.filter(w => w.clientId === client.id && w.exercises && w.exercises.length > 0)
                                : workouts.filter(w => w.exercises && w.exercises.length > 0);
                            
                            // Sort by date (most recent first)
                            const sortedWorkouts = filteredWorkouts.sort((a, b) => {
                                const dateA = new Date(a.date);
                                const dateB = new Date(b.date);
                                return dateB - dateA;
                            });

                            if (sortedWorkouts.length === 0) {
                                return (
                                    <div className="text-center py-8">
                                        <p className="text-gray-400">
                                            {client 
                                                ? `No workouts found for ${client.name}`
                                                : 'No client workouts available'}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                                    {sortedWorkouts.map(workout => {
                                        const workoutClient = clients.find(c => c.id === workout.clientId);
                                        const workoutDate = workout.date ? new Date(workout.date + 'T00:00:00').toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        }) : 'No date';
                                        
                                        return (
                                            <button
                                                key={workout.id}
                                                onClick={() => handleAddWorkoutFromClient(workout)}
                                                className="w-full text-left glass rounded-lg p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <h3 className="font-semibold text-white">
                                                                {workout.name || workoutDate}
                                                            </h3>
                                                            {!client && workoutClient && (
                                                                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                                                                    {workoutClient.name}
                                                                </span>
                                                            )}
                                                            {workout.time && (
                                                                <span className="text-xs text-gray-400">
                                                                    {workout.time}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!workout.name && (
                                                            <p className="text-sm text-gray-400 mb-2">{workoutDate}</p>
                                                        )}
                                                        <div className="flex flex-wrap gap-2">
                                                            {workout.exercises?.slice(0, 5).map((ex, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded"
                                                                >
                                                                    {getExerciseName(ex.exerciseId)}
                                                                </span>
                                                            ))}
                                                            {workout.exercises?.length > 5 && (
                                                                <span className="text-xs text-gray-400">
                                                                    +{workout.exercises.length - 5} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })()}
                    </div>
                </Modal>
            )}

            {/* Save Template Dialog */}
            {showSaveTemplateDialog && (
                <Modal 
                    isOpen={showSaveTemplateDialog} 
                    onClose={() => {
                        setShowSaveTemplateDialog(false);
                        setTemplateName('');
                    }} 
                    title="Save Workout to Library" 
                    size="md"
                >
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="template-name" className="block text-sm font-medium text-gray-300 mb-2">
                                Workout Name
                            </label>
                            <input
                                id="template-name"
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && templateName.trim()) {
                                        handleConfirmSaveTemplate();
                                    }
                                }}
                                placeholder="Enter a name for this workout template..."
                                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                        <div className="text-sm text-gray-400">
                            {isGroupSession && client?.groupSessionId && client?.groupClients
                                ? `This will save separate workout templates for each client in the group session. Each template will be named "[Group Name] - [Client Name]" and will contain only that client's exercises.`
                                : 'This workout will be saved to your library and can be reused for any client.'}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <Button 
                                onClick={() => {
                                    setShowSaveTemplateDialog(false);
                                    setTemplateName('');
                                }} 
                                variant="ghost" 
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirmSaveTemplate}
                                className="flex-1"
                                disabled={!templateName.trim()}
                            >
                                Save to Library
                            </Button>
                </div>
            </div>
                </Modal>
            )}
        </Modal>
    );
};
