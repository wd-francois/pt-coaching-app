// Valid new categories
export const VALID_CATEGORIES = [
    'Barbell',
    'Bodyweight',
    'Dumbbell',
    'Cable',
    'Machine',
    'EZ Bar',
    'Landmine',
    'Band',
];

// Map old categories to new categories
const CATEGORY_MIGRATION_MAP = {
    'Strength': 'Barbell',
    'Cardio': 'Bodyweight',
    'Flexibility': 'Bodyweight',
    'Balance': 'Bodyweight',
    'Plyometrics': 'Bodyweight',
    'Core': 'Bodyweight',
    'Other': 'Barbell',
};

/**
 * Normalizes an exercise category, migrating old categories to new ones
 * @param {string} category - The category to normalize
 * @returns {string} - The normalized category (defaults to 'Barbell' if invalid)
 */
export const normalizeCategory = (category) => {
    if (!category) return 'Barbell';
    
    // If it's already a valid new category, return it
    if (VALID_CATEGORIES.includes(category)) {
        return category;
    }
    
    // If it's an old category, migrate it
    if (CATEGORY_MIGRATION_MAP[category]) {
        return CATEGORY_MIGRATION_MAP[category];
    }
    
    // Default to Barbell for unknown categories
    return 'Barbell';
};

/**
 * Migrates an exercise object's category if needed
 * @param {Object} exercise - The exercise object
 * @returns {Object} - The exercise with normalized category
 */
export const migrateExercise = (exercise) => {
    if (!exercise) return exercise;
    
    const normalizedCategory = normalizeCategory(exercise.category);
    
    // Only return a new object if the category changed
    if (normalizedCategory !== exercise.category) {
        return {
            ...exercise,
            category: normalizedCategory,
        };
    }
    
    return exercise;
};

/**
 * Migrates an array of exercises
 * @param {Array} exercises - Array of exercise objects
 * @returns {Array} - Array of exercises with normalized categories
 */
export const migrateExercises = (exercises) => {
    if (!Array.isArray(exercises)) return exercises;
    
    return exercises.map(migrateExercise);
};
