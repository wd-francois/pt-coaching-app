import { useState, useMemo } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { WorkoutBuilder } from './WorkoutBuilder';
import { VALID_CATEGORIES, normalizeCategory } from '../../utils/exerciseCategoryMigration';

export const WorkoutLibrary = ({
    isOpen,
    onClose,
    workoutTemplates,
    exercises,
    onSelectTemplate,
    onDeleteTemplate,
    onUpdateTemplate,
    onCreateWorkoutTemplate,
    selectedDate = null,
    onAddToDate = null,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [editingTemplateFull, setEditingTemplateFull] = useState(null);
    const [editName, setEditName] = useState('');

    const categories = ['All', ...VALID_CATEGORIES];

    const filteredTemplates = useMemo(() => {
        let filtered = [...workoutTemplates];
        
        // Apply search filter
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(template => {
                const name = template.name?.toLowerCase() || '';
                const exerciseNames = getExerciseNames(template.exercises || []).join(' ').toLowerCase();
                const tags = (template.tags || []).join(' ').toLowerCase();
                
                return name.includes(lowerSearch) ||
                       exerciseNames.includes(lowerSearch) ||
                       tags.includes(lowerSearch);
            });
        }
        
        // Apply category filter
        if (filterCategory !== 'All') {
            filtered = filtered.filter(template => {
                // Check if any exercise in the workout matches the selected category
                const workoutExercises = template.exercises || [];
                return workoutExercises.some(workoutEx => {
                    const exercise = exercises.find(e => e.id === workoutEx.exerciseId);
                    if (!exercise) return false;
                    const exerciseCategory = normalizeCategory(exercise.category);
                    return exerciseCategory === filterCategory;
                });
            });
        }
        
        return filtered;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workoutTemplates, searchTerm, filterCategory, exercises]);

    const getExerciseName = (exerciseId) => {
        const exercise = exercises.find(e => e.id === exerciseId);
        return exercise?.name || 'Unknown Exercise';
    };

    const getExerciseNames = (templateExercises) => {
        return templateExercises.map(ex => {
            const exercise = exercises.find(e => e.id === ex.exerciseId);
            return exercise?.name || 'Unknown Exercise';
        });
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Unknown date';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleSelect = (template) => {
        onSelectTemplate(template);
        onClose();
    };

    const handleAddToDate = (e, template) => {
        e.stopPropagation();
        e.preventDefault();
        if (onAddToDate && selectedDate) {
            onAddToDate(template);
            // Don't close the library here - let the parent handle it
            // This allows for better UX flow
        } else if (onSelectTemplate) {
            // Fallback: just select the template
            handleSelect(template);
        }
    };

    const handleDelete = async (e, templateId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this workout from the library?')) {
            await onDeleteTemplate(templateId);
        }
    };

    const handleEdit = (e, template) => {
        e.stopPropagation();
        setEditingTemplate(template);
        setEditName(template.name || '');
    };

    const handleEditFull = (e, template) => {
        e.stopPropagation();
        setEditingTemplateFull(template);
    };

    const handleCloseFullEdit = () => {
        setEditingTemplateFull(null);
    };

    const handleSaveEdit = async () => {
        if (!editName || !editName.trim()) {
            alert('Please enter a name for this workout template');
            return;
        }

        if (editingTemplate && onUpdateTemplate) {
            await onUpdateTemplate(editingTemplate.id, { name: editName.trim() });
            setEditingTemplate(null);
            setEditName('');
        }
    };

    const handleCancelEdit = () => {
        setEditingTemplate(null);
        setEditName('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Workout Library" size="lg">
            <div className="space-y-4">
                {/* Search and Filters */}
                <div className="glass rounded-lg p-4 space-y-4">
                    <input
                        type="text"
                        placeholder="Search workouts by name, exercise, or tags..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-400"
                    />

                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => {
                            const isActive = filterCategory === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setFilterCategory(cat)}
                                    className={`px-3 py-1 rounded-full text-sm transition-all cursor-pointer ${
                                        isActive
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/10 text-gray-100 hover:bg-white/20'
                                    }`}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Templates List */}
                {workoutTemplates.length === 0 ? (
                    <div className="glass rounded-lg p-8 text-center">
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-gray-200 text-lg mb-2">No workouts in library</p>
                        <p className="text-gray-300 text-sm">Save workouts from the workout builder to build your library</p>
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="glass rounded-lg p-8 text-center">
                        <p className="text-gray-200">
                            {searchTerm || filterCategory !== 'All' ? 'No workouts match your search.' : 'No workouts in library'}
                        </p>
                        {searchTerm || filterCategory !== 'All' ? (
                            <p className="text-gray-300 text-sm mt-2">Try adjusting your filters</p>
                        ) : null}
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                        {filteredTemplates.map(template => (
                            <div
                                key={template.id}
                                className="glass rounded-lg p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => handleSelect(template)}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-white text-lg">
                                                {template.name || 'Unnamed Workout'}
                                            </h3>
                                            <span className="text-xs text-gray-200 bg-white/10 px-2 py-1 rounded-full">
                                                {template.exercises?.length || 0} exercises
                                            </span>
                                        </div>
                                        
                                        {/* Exercise Preview */}
                                        <div className="mb-2">
                                            <p className="text-sm text-gray-200 mb-1">Exercises:</p>
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
                                                    <span className="text-xs text-gray-200">
                                                        +{template.exercises.length - 5} more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-xs text-gray-300">
                                            Created {formatDate(template.createdAt)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {selectedDate && onAddToDate && (
                                            <button
                                                onClick={(e) => handleAddToDate(e, template)}
                                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                                                title={`Add to ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                <span>Add to Date</span>
                                            </button>
                                        )}
                                        {onUpdateTemplate && (
                                            <>
                                                <button
                                                    onClick={(e) => handleEditFull(e, template)}
                                                    className="p-2 hover:bg-green-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit workout exercises"
                                                >
                                                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => handleEdit(e, template)}
                                                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Edit workout name"
                                                >
                                                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                            </>
                                        )}
                                        <button
                                            onClick={(e) => handleDelete(e, template.id)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete workout"
                                        >
                                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <svg className="w-5 h-5 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Name Dialog - Rendered outside main modal */}
            {editingTemplate && (
                <Modal isOpen={!!editingTemplate} onClose={handleCancelEdit} title="Edit Workout Name" size="md">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="edit-workout-name" className="block text-sm font-medium text-gray-100 mb-2">
                                Workout Name
                            </label>
                            <input
                                id="edit-workout-name"
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editName.trim()) {
                                        handleSaveEdit();
                                    }
                                }}
                                placeholder="Enter a name for this workout template..."
                                className="w-full px-4 py-2 bg-white/5 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <Button 
                                onClick={handleCancelEdit} 
                                variant="ghost" 
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSaveEdit}
                                className="flex-1"
                                disabled={!editName.trim()}
                            >
                                Save
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Full Workout Editor */}
            {editingTemplateFull && (
                <WorkoutBuilder
                    isOpen={!!editingTemplateFull}
                    onClose={handleCloseFullEdit}
                    onBack={handleCloseFullEdit}
                    exercises={exercises}
                    existingWorkout={{
                        id: editingTemplateFull.id,
                        name: editingTemplateFull.name,
                        exercises: editingTemplateFull.exercises || [],
                        isTemplate: true,
                    }}
                    onCreateWorkout={() => {}}
                    onUpdateWorkout={() => {}}
                    onDeleteWorkout={() => {}}
                    onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                    onUpdateWorkoutTemplate={async (id, updates) => {
                        await onUpdateTemplate(id, updates);
                        setEditingTemplateFull(null);
                    }}
                    isLibraryMode={true}
                />
            )}
        </Modal>
    );
};





