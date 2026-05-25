import React, { useState, useEffect } from 'react';

const PersonalBestForm = ({ onSubmit, onCancel, initialData = null, exercises = [] }) => {
  const [formData, setFormData] = useState({
    exerciseId: initialData?.exerciseId || '',
    exerciseName: initialData?.exerciseName || '',
    weight: initialData?.weight || '',
    reps: initialData?.reps || '',
    sets: initialData?.sets || '',
    date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    notes: initialData?.notes || ''
  });

  const [errors, setErrors] = useState({});

  // Update form data when initialData changes (for editing)
  // Using a key prop on the parent component is preferred, but for now we'll use a ref to track previous initialData
  const prevInitialDataRef = React.useRef();
  useEffect(() => {
    if (initialData && initialData !== prevInitialDataRef.current) {
      prevInitialDataRef.current = initialData;
      // Only update if initialData actually changed
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        exerciseId: initialData.exerciseId || '',
        exerciseName: initialData.exerciseName || '',
        weight: initialData.weight || '',
        reps: initialData.reps || '',
        sets: initialData.sets || '',
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        notes: initialData.notes || ''
      });
    }
  }, [initialData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // If exercise is selected, also store the exercise name
    if (field === 'exerciseId' && exercises.length > 0) {
      const selectedExercise = exercises.find(ex => ex.id === value);
      setFormData(prev => ({
        ...prev,
        exerciseId: value,
        exerciseName: selectedExercise ? selectedExercise.name : ''
      }));
    } else if (field === 'exerciseName') {
      setFormData(prev => ({
        ...prev,
        exerciseId: value,
        exerciseName: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Exercise is required
    if (exercises.length > 0) {
      if (!formData.exerciseId.trim()) {
        newErrors.exerciseId = 'Exercise is required';
      }
    } else {
      if (!formData.exerciseName.trim()) {
        newErrors.exerciseId = 'Exercise name is required';
      }
    }

    // Weight is required
    if (!formData.weight.trim()) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(parseFloat(formData.weight)) || parseFloat(formData.weight) <= 0) {
      newErrors.weight = 'Please enter a valid weight';
    }

    // Reps is required
    if (!formData.reps.trim()) {
      newErrors.reps = 'Reps is required';
    } else if (isNaN(parseInt(formData.reps)) || parseInt(formData.reps) <= 0) {
      newErrors.reps = 'Please enter a valid number of reps';
    }

    // Sets is optional but must be valid if provided
    if (formData.sets.trim() && (isNaN(parseInt(formData.sets)) || parseInt(formData.sets) <= 0)) {
      newErrors.sets = 'Please enter a valid number of sets';
    }

    // Date is required
    if (!formData.date.trim()) {
      newErrors.date = 'Date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const selectedExercise = exercises.find(ex => ex.id === formData.exerciseId);
      const submissionData = {
        exerciseId: formData.exerciseId || formData.exerciseName,
        exerciseName: selectedExercise ? selectedExercise.name : formData.exerciseName,
        weight: parseFloat(formData.weight),
        reps: parseInt(formData.reps),
        sets: formData.sets ? parseInt(formData.sets) : null,
        date: new Date(formData.date).getTime(),
        notes: formData.notes || '',
        id: initialData?.id || null
      };

      onSubmit(submissionData);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="exerciseId" className="block text-sm font-medium text-gray-100 mb-1">
            Exercise <span className="text-red-400">*</span>
          </label>
          {exercises.length > 0 ? (
            <select
              id="exerciseId"
              value={formData.exerciseId}
              onChange={(e) => handleInputChange('exerciseId', e.target.value)}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white ${
                errors.exerciseId ? 'border-red-500 border' : ''
              }`}
            >
              <option value="">Select an exercise</option>
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id} className="bg-gray-800 text-white">
                  {exercise.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              id="exerciseName"
              type="text"
              value={formData.exerciseName}
              onChange={(e) => {
                handleInputChange('exerciseName', e.target.value);
                handleInputChange('exerciseId', e.target.value);
              }}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 ${
                errors.exerciseId ? 'border-red-500 border' : ''
              }`}
              placeholder="Enter exercise name"
            />
          )}
          {errors.exerciseId && (
            <p className="mt-1 text-sm text-red-400">{errors.exerciseId}</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-100 mb-1">
              Weight (kg) <span className="text-red-400">*</span>
            </label>
            <input
              id="weight"
              type="number"
              step="0.1"
              min="0"
              value={formData.weight}
              onChange={(e) => handleInputChange('weight', e.target.value)}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 ${
                errors.weight ? 'border-red-500 border' : ''
              }`}
              placeholder="Enter weight"
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-400">{errors.weight}</p>
            )}
          </div>

          <div>
            <label htmlFor="reps" className="block text-sm font-medium text-gray-100 mb-1">
              Reps <span className="text-red-400">*</span>
            </label>
            <input
              id="reps"
              type="number"
              min="1"
              value={formData.reps}
              onChange={(e) => handleInputChange('reps', e.target.value)}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 ${
                errors.reps ? 'border-red-500 border' : ''
              }`}
              placeholder="Enter reps"
            />
            {errors.reps && (
              <p className="mt-1 text-sm text-red-400">{errors.reps}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="sets" className="block text-sm font-medium text-gray-100 mb-1">
              Sets (Optional)
            </label>
            <input
              id="sets"
              type="number"
              min="1"
              value={formData.sets}
              onChange={(e) => handleInputChange('sets', e.target.value)}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400 ${
                errors.sets ? 'border-red-500 border' : ''
              }`}
              placeholder="Enter sets"
            />
            {errors.sets && (
              <p className="mt-1 text-sm text-red-400">{errors.sets}</p>
            )}
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-100 mb-1">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white ${
                errors.date ? 'border-red-500 border' : ''
              }`}
            />
            {errors.date && (
              <p className="mt-1 text-sm text-red-400">{errors.date}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-100 mb-1">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 glass rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-white placeholder-gray-400"
            placeholder="Add any additional notes about this personal best..."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 text-sm font-medium text-white glass glass-hover rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors min-h-[44px]"
          >
            {initialData ? 'Update Personal Best' : 'Save Personal Best'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PersonalBestForm;
