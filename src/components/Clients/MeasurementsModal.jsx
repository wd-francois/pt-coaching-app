import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { MeasurementsForm } from './MeasurementsForm';
import { MeasurementsList } from './MeasurementsList';

export const MeasurementsModal = ({ isOpen, onClose, client, onCreateMeasurement, onUpdateMeasurement, onDeleteMeasurement, getMeasurementsByClient }) => {
    const [measurements, setMeasurements] = useState([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && client) {
            loadMeasurements();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, client]);

    const loadMeasurements = async () => {
        if (!client) return;
        setLoading(true);
        try {
            const clientMeasurements = await getMeasurementsByClient(client.id);
            setMeasurements(clientMeasurements);
        } catch (error) {
            console.error('Error loading measurements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMeasurement = () => {
        setEditingMeasurement(null);
        setIsFormOpen(true);
    };

    const handleEditMeasurement = (measurement) => {
        setEditingMeasurement(measurement);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (measurementData) => {
        try {
            if (editingMeasurement) {
                await onUpdateMeasurement(editingMeasurement.id, {
                    ...measurementData,
                    clientId: client.id,
                });
            } else {
                await onCreateMeasurement({
                    ...measurementData,
                    clientId: client.id,
                });
            }
            setIsFormOpen(false);
            setEditingMeasurement(null);
            await loadMeasurements();
        } catch (error) {
            console.error('Error saving measurement:', error);
        }
    };

    const handleDeleteMeasurement = async (id) => {
        try {
            await onDeleteMeasurement(id);
            await loadMeasurements();
        } catch (error) {
            console.error('Error deleting measurement:', error);
        }
    };

    const handleClose = () => {
        setIsFormOpen(false);
        setEditingMeasurement(null);
        onClose();
    };

    if (!client) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Measurements - ${client.name}`}
            size="lg"
        >
            {isFormOpen ? (
                <MeasurementsForm
                    onSubmit={handleFormSubmit}
                    onCancel={() => {
                        setIsFormOpen(false);
                        setEditingMeasurement(null);
                    }}
                    initialData={editingMeasurement}
                />
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">
                            Track and monitor client progress over time
                        </p>
                        <Button
                            onClick={handleAddMeasurement}
                            variant="primary"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        >
                            Add Measurement
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Loading measurements...</p>
                        </div>
                    ) : (
                        <MeasurementsList
                            measurements={measurements}
                            onEdit={handleEditMeasurement}
                            onDelete={handleDeleteMeasurement}
                        />
                    )}
                </div>
            )}
        </Modal>
    );
};
