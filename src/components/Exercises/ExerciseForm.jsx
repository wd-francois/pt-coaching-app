import { useState, useEffect } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

const validateUrl = (url) => {
    if (!url || !url.trim()) return true; // Optional field
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

const CATEGORIES = [
    'Strength',
    'Cardio',
    'Flexibility',
    'Balance',
    'Plyometrics',
    'Core',
    'Other',
];

const EQUIPMENT_TAGS = [
    'Barbell',
    'Bodyweight',
    'Dumbbell',
    'Cable',
    'Machine',
    'EZ Bar',
    'Landmine',
    'Band',
    'Kettlebell',
    'Resistance Band',
    'TRX',
    'Medicine Ball',
    'Plate',
    'Smith Machine',
    'Pulley',
];

export const ExerciseForm = ({ isOpen, onClose, onSubmit, initialData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'Strength',
        videoUrl: '',
        equipment: [], // Array of equipment tags
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Update form data when initialData changes (for editing)
    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                category: initialData.category || 'Strength',
                videoUrl: initialData.videoUrl || '',
                equipment: Array.isArray(initialData.equipment) ? initialData.equipment : (initialData.equipment ? [initialData.equipment] : []),
            });
        } else {
            // Reset form when adding new exercise
            setFormData({
                name: '',
                description: '',
                category: 'Strength',
                videoUrl: '',
                equipment: [],
            });
        }
    }, [initialData, isOpen]);

    const validateField = (name, value) => {
        const newErrors = { ...errors };
        
        switch (name) {
            case 'name':
                if (!value.trim()) {
                    newErrors.name = 'Exercise name is required';
                } else if (value.trim().length < 2) {
                    newErrors.name = 'Exercise name must be at least 2 characters';
                } else {
                    delete newErrors.name;
                }
                break;
            case 'videoUrl':
                if (value && !validateUrl(value)) {
                    newErrors.videoUrl = 'Please enter a valid URL';
                } else {
                    delete newErrors.videoUrl;
                }
                break;
            default:
                break;
        }
        
        setErrors(newErrors);
        return !newErrors[name];
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value);
    };

    const validateForm = () => {
        const isValid = validateField('name', formData.name);
        if (formData.videoUrl) validateField('videoUrl', formData.videoUrl);
        return isValid && Object.keys(errors).length === 0;
    };

    const handleEquipmentToggle = (equipment) => {
        setFormData(prev => {
            const equipmentArray = prev.equipment || [];
            if (equipmentArray.includes(equipment)) {
                return { ...prev, equipment: equipmentArray.filter(e => e !== equipment) };
            } else {
                return { ...prev, equipment: [...equipmentArray, equipment] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setLoading(true);
        try {
            // Trim videoUrl and set to empty string if it's just whitespace
            const submissionData = {
                ...formData,
                videoUrl: formData.videoUrl?.trim() || '',
                equipment: formData.equipment || [],
            };
            await onSubmit(submissionData);
            onClose();
            setFormData({ name: '', description: '', category: 'Strength', videoUrl: '', equipment: [] });
            setErrors({});
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={initialData ? 'Edit Exercise' : 'Add New Exercise'} size="md">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Exercise Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={(e) => validateField('name', e.target.value)}
                        required
                        aria-invalid={errors.name ? 'true' : 'false'}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${errors.name ? 'border-2 border-red-500' : ''}`}
                        placeholder="e.g., Barbell Squat"
                    />
                    {errors.name && (
                        <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="category" className="block text-sm font-medium mb-2">
                        Category <span className="text-red-400">*</span>
                    </label>
                    <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat} className="bg-gray-800">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2">
                        Equipment Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {EQUIPMENT_TAGS.map(equipment => {
                            const isSelected = formData.equipment?.includes(equipment);
                            return (
                                <button
                                    key={equipment}
                                    type="button"
                                    onClick={() => handleEquipmentToggle(equipment)}
                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                        isSelected
                                            ? 'bg-purple-600 text-white'
                                            : 'bg-white/10 text-gray-100 hover:bg-white/20'
                                    }`}
                                >
                                    {equipment}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium mb-2">
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 resize-none"
                        placeholder="Exercise instructions and tips..."
                    />
                </div>

                <div>
                    <label htmlFor="videoUrl" className="block text-sm font-medium mb-2">
                        Video URL (Optional)
                    </label>
                    <input
                        type="text"
                        id="videoUrl"
                        name="videoUrl"
                        value={formData.videoUrl}
                        onChange={handleChange}
                        onBlur={(e) => validateField('videoUrl', e.target.value)}
                        aria-invalid={errors.videoUrl ? 'true' : 'false'}
                        aria-describedby={errors.videoUrl ? 'videoUrl-error' : undefined}
                        className={`w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 ${errors.videoUrl ? 'border-2 border-red-500' : ''}`}
                        placeholder="https://youtube.com/watch?v=... (optional)"
                    />
                    {errors.videoUrl && (
                        <p id="videoUrl-error" className="mt-1 text-sm text-red-400" role="alert">
                            {errors.videoUrl}
                        </p>
                    )}
                    {formData.videoUrl && (
                        <a
                            href={formData.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-sm text-purple-400 hover:text-purple-300"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Preview video
                        </a>
                    )}
                </div>

                <div className="flex gap-3 pt-4">
                    <Button type="submit" variant="primary" loading={loading} className="flex-1">
                        {initialData ? 'Update Exercise' : 'Add Exercise'}
                    </Button>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
