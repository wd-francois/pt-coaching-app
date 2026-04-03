import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import PersonalBestForm from './PersonalBestForm';

export const ClientPersonalBests = ({ isOpen, onClose, client, exercises = [], onCreate, onUpdate, onDelete, getPersonalBestsByClient }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingPersonalBest, setEditingPersonalBest] = useState(null);
    const [clientPersonalBests, setClientPersonalBests] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && client) {
            loadPersonalBests();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, client]);

    const loadPersonalBests = async () => {
        if (!client) return;
        setLoading(true);
        try {
            const data = await getPersonalBestsByClient(client.id);
            setClientPersonalBests(data);
        } catch (error) {
            console.error('Error loading personal bests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setEditingPersonalBest(null);
        setIsFormOpen(true);
    };

    const handleEdit = (personalBest) => {
        setEditingPersonalBest(personalBest);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (personalBestData) => {
        try {
            if (editingPersonalBest) {
                await onUpdate(editingPersonalBest.id, { ...personalBestData, clientId: client.id });
            } else {
                await onCreate({ ...personalBestData, clientId: client.id });
            }
            setIsFormOpen(false);
            setEditingPersonalBest(null);
            await loadPersonalBests();
        } catch (error) {
            console.error('Error saving personal best:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this personal best?')) {
            try {
                await onDelete(id);
                await loadPersonalBests();
            } catch (error) {
                console.error('Error deleting personal best:', error);
            }
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingPersonalBest(null);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const formatValue = (value, unit = '') => {
        if (value === null || value === undefined || value === '') return '-';
        return unit ? `${value} ${unit}` : value;
    };

    if (!isOpen || !client) return null;

    return (
        <>
            <Modal
                isOpen={isOpen && !isFormOpen}
                onClose={onClose}
                title={`Personal Bests - ${client.name}`}
                size="xl"
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400">Track and manage client personal best lifts</p>
                        <Button onClick={handleAdd} icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }>
                            Add Personal Best
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : clientPersonalBests.length === 0 ? (
                        <div className="glass rounded-lg p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">No personal bests yet</h3>
                            <p className="text-gray-400 mb-6">Get started by adding the first personal best</p>
                            <Button onClick={handleAdd}>Add First Personal Best</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clientPersonalBests.map((personalBest) => (
                                <div key={personalBest.id} className="glass rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-white">
                                                {personalBest.exerciseName || 'Unknown Exercise'}
                                            </h4>
                                            <p className="text-sm text-gray-400 mt-1">
                                                {formatDate(personalBest.date || personalBest.createdAt)}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEdit(personalBest)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(personalBest.id)}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-400">Weight:</span>
                                            <p className="text-white font-medium">{formatValue(personalBest.weight, 'kg')}</p>
                                        </div>
                                        <div>
                                            <span className="text-gray-400">Reps:</span>
                                            <p className="text-white font-medium">{formatValue(personalBest.reps)}</p>
                                        </div>
                                        {personalBest.sets && (
                                            <div>
                                                <span className="text-gray-400">Sets:</span>
                                                <p className="text-white font-medium">{formatValue(personalBest.sets)}</p>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-400">Date:</span>
                                            <p className="text-white font-medium">{formatDate(personalBest.date || personalBest.createdAt)}</p>
                                        </div>
                                    </div>

                                    {personalBest.notes && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400 mb-1">Notes:</p>
                                            <p className="text-sm text-gray-300">{personalBest.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Personal Best Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                title={editingPersonalBest ? 'Edit Personal Best' : 'Add New Personal Best'}
                size="lg"
            >
                <PersonalBestForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseForm}
                    initialData={editingPersonalBest}
                    exercises={exercises}
                />
            </Modal>
        </>
    );
};
