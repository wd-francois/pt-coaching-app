import { useState, useEffect } from 'react';
import { Modal } from '../UI/Modal';
import { Button } from '../UI/Button';
import { MeasurementsForm } from './MeasurementsForm';

const SKINFOLD_ROWS = [
  { site: 'chest', label: 'Chest', legacyKey: 'chestSkinfold' },
  { site: 'abdominal', label: 'Abdominal', legacyKey: 'abdominalSkinfold' },
  { site: 'thigh', label: 'Thigh', legacyKey: 'thighSkinfold' },
  { site: 'tricep', label: 'Tricep', legacyKey: 'tricepSkinfold' },
  { site: 'subscapular', label: 'Subscapular', legacyKey: 'subscapularSkinfold' },
  { site: 'suprailiac', label: 'Suprailiac', legacyKey: 'suprailiacSkinfold' },
];

const formatSkinfoldReadingsLine = (readings, legacySingle) => {
  if (readings && Array.isArray(readings)) {
    const parts = readings.map((v) =>
      v != null && v !== '' && !Number.isNaN(Number(v)) ? String(v) : null
    );
    if (parts.some(Boolean)) {
      const filled = parts.filter(Boolean);
      if (filled.length === 1) return filled[0];
      return parts.map((p) => p ?? '—').join(' / ');
    }
  }
  if (legacySingle != null && legacySingle !== '') return String(legacySingle);
  return null;
};

export const ClientMeasurements = ({ isOpen, onClose, client, onCreate, onUpdate, onDelete, getMeasurementsByClient }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [clientMeasurements, setClientMeasurements] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadMeasurements = async () => {
        if (!client) return;
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

    useEffect(() => {
        if (isOpen && client) {
            loadMeasurements();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, client]);

    const handleAdd = () => {
        setEditingMeasurement(null);
        setIsFormOpen(true);
    };

    const handleEdit = (measurement) => {
        setEditingMeasurement(measurement);
        setIsFormOpen(true);
    };

    const handleFormSubmit = async (measurementData) => {
        try {
            const payload = { ...measurementData, clientId: client.id };
            if (payload.date == null) {
                payload.date = editingMeasurement?.date ?? Date.now();
            }
            if (editingMeasurement) {
                await onUpdate(editingMeasurement.id, payload);
            } else {
                await onCreate(payload);
            }
            setIsFormOpen(false);
            setEditingMeasurement(null);
            await loadMeasurements();
        } catch (error) {
            console.error('Error saving measurement:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this measurement?')) {
            try {
                await onDelete(id);
                await loadMeasurements();
            } catch (error) {
                console.error('Error deleting measurement:', error);
            }
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingMeasurement(null);
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

    const formatValue = (value, unit) => {
        if (value === null || value === undefined || value === '') return '-';
        return `${value} ${unit}`;
    };

    if (!isOpen || !client) return null;

    return (
        <>
            <Modal
                isOpen={isOpen && !isFormOpen}
                onClose={onClose}
                title={`Measurements - ${client.name}`}
                size="xl"
            >
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400">Track and manage client measurements over time</p>
                        <Button onClick={handleAdd} icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }>
                            Add Measurement
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : clientMeasurements.length === 0 ? (
                        <div className="glass rounded-lg p-12 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold mb-2 text-white">No measurements yet</h3>
                            <p className="text-gray-400 mb-6">Get started by adding the first measurement</p>
                            <Button onClick={handleAdd}>Add First Measurement</Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {clientMeasurements.map((measurement) => (
                                <div key={measurement.id} className="glass rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h4 className="text-lg font-semibold text-white">
                                                {formatDate(measurement.date || measurement.createdAt)}
                                            </h4>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleEdit(measurement)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="danger"
                                                onClick={() => handleDelete(measurement.id)}
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
                                            <p className="text-white font-medium">{formatValue(measurement.weight, 'kg')}</p>
                                        </div>
                                        {measurement.chest && (
                                            <div>
                                                <span className="text-gray-400">Chest:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.chest, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.waist && (
                                            <div>
                                                <span className="text-gray-400">Waist:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.waist, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.hips && (
                                            <div>
                                                <span className="text-gray-400">Hips:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.hips, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.neck && (
                                            <div>
                                                <span className="text-gray-400">Neck:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.neck, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.shoulders && (
                                            <div>
                                                <span className="text-gray-400">Shoulders:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.shoulders, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.thigh != null && measurement.thigh !== '' && (
                                            <div>
                                                <span className="text-gray-400">Thigh (Upper):</span>
                                                <p className="text-white font-medium">{formatValue(measurement.thigh, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.thighLower != null && measurement.thighLower !== '' && (
                                            <div>
                                                <span className="text-gray-400">Thigh (Lower):</span>
                                                <p className="text-white font-medium">{formatValue(measurement.thighLower, 'cm')}</p>
                                            </div>
                                        )}
                                        {measurement.arm && (
                                            <div>
                                                <span className="text-gray-400">Arm:</span>
                                                <p className="text-white font-medium">{formatValue(measurement.arm, 'cm')}</p>
                                            </div>
                                        )}
                                    </div>

                                    {SKINFOLD_ROWS.some(
                                        ({ site, legacyKey }) =>
                                            formatSkinfoldReadingsLine(
                                                measurement.skinfoldReadings?.[site],
                                                measurement[legacyKey]
                                            ) != null
                                    ) && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400 mb-2">Skinfolds:</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                                                {SKINFOLD_ROWS.map(({ site, label, legacyKey }) => {
                                                    const line = formatSkinfoldReadingsLine(
                                                        measurement.skinfoldReadings?.[site],
                                                        measurement[legacyKey]
                                                    );
                                                    if (!line) return null;
                                                    return (
                                                        <div key={site}>
                                                            <span className="text-gray-400">{label}:</span>
                                                            <span className="text-white ml-1">{line} mm</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {measurement.notes && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-xs text-gray-400 mb-1">Notes:</p>
                                            <p className="text-sm text-gray-300">{measurement.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

            {/* Measurement Form Modal */}
            <Modal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                title={editingMeasurement ? 'Edit Measurement' : 'Add New Measurement'}
                size="lg"
            >
                <MeasurementsForm
                    onSubmit={handleFormSubmit}
                    onCancel={handleCloseForm}
                    initialData={editingMeasurement}
                />
            </Modal>
        </>
    );
};
