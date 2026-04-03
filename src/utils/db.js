import { openDB } from 'idb';

export const DB_NAME = 'PTCoachingDB';
/** Bump when schema repair is needed (e.g. missing object stores on existing DBs). */
export const DB_VERSION = 11;

// Initialize the database
export const initDB = async () => {
    try {
        const db = await openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, newVersion) {
                console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
                
                // Create clients store
                if (!db.objectStoreNames.contains('clients')) {
                    const clientStore = db.createObjectStore('clients', { keyPath: 'id' });
                    clientStore.createIndex('name', 'name', { unique: false });
                }

                // Create exercises store
                if (!db.objectStoreNames.contains('exercises')) {
                    const exerciseStore = db.createObjectStore('exercises', { keyPath: 'id' });
                    exerciseStore.createIndex('name', 'name', { unique: false });
                    exerciseStore.createIndex('category', 'category', { unique: false });
                }

                // Create workouts store
                if (!db.objectStoreNames.contains('workouts')) {
                    const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
                    workoutStore.createIndex('date', 'date', { unique: false });
                    workoutStore.createIndex('clientId', 'clientId', { unique: false });
                }

                // Create measurements store
                if (!db.objectStoreNames.contains('measurements')) {
                    const measurementStore = db.createObjectStore('measurements', { keyPath: 'id' });
                    measurementStore.createIndex('clientId', 'clientId', { unique: false });
                    measurementStore.createIndex('date', 'date', { unique: false });
                }

                // Create workout templates store
                if (!db.objectStoreNames.contains('workoutTemplates')) {
                    const templateStore = db.createObjectStore('workoutTemplates', { keyPath: 'id' });
                    templateStore.createIndex('name', 'name', { unique: false });
                    templateStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            },
            blocked() {
                console.warn('Database upgrade blocked - another tab may be open');
            },
            blocking() {
                console.warn('Database upgrade blocking - closing connections');
            },
        });
        
        // Verify stores exist
        if (!db.objectStoreNames.contains('clients') || 
            !db.objectStoreNames.contains('exercises') || 
            !db.objectStoreNames.contains('workouts') ||
            !db.objectStoreNames.contains('measurements') ||
            !db.objectStoreNames.contains('workoutTemplates')) {
            console.error('Database stores missing - this should not happen');
        }
        
        return db;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Generate UUID
export const generateId = () => {
    return crypto.randomUUID();
};

// Client operations
export const addClient = async (client) => {
    try {
        const db = await initDB();
        const id = generateId();
        const newClient = {
            ...client,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.add('clients', newClient);
        console.log('Client saved to IndexedDB:', newClient.name);
        
        // Backup to localStorage as well
        try {
            const allClients = await db.getAll('clients');
            localStorage.setItem('clients_backup', JSON.stringify(allClients));
            console.log('Client backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup client to localStorage:', backupError);
        }
        
        return newClient;
    } catch (error) {
        console.error('Error adding client:', error);
        throw error;
    }
};

export const updateClient = async (id, updates) => {
    try {
        const db = await initDB();
        const client = await db.get('clients', id);
        if (!client) throw new Error('Client not found');

        const updatedClient = {
            ...client,
            ...updates,
            id, // Ensure id doesn't change
            updatedAt: Date.now(),
        };
        await db.put('clients', updatedClient);
        
        // Update backup
        try {
            const allClients = await db.getAll('clients');
            localStorage.setItem('clients_backup', JSON.stringify(allClients));
        } catch (backupError) {
            console.warn('Failed to update client backup:', backupError);
        }
        
        return updatedClient;
    } catch (error) {
        console.error('Error updating client:', error);
        throw error;
    }
};

export const deleteClient = async (id) => {
    try {
        const db = await initDB();
        await db.delete('clients', id);
        
        // Update backup
        try {
            const allClients = await db.getAll('clients');
            localStorage.setItem('clients_backup', JSON.stringify(allClients));
        } catch (backupError) {
            console.warn('Failed to update client backup:', backupError);
        }
    } catch (error) {
        console.error('Error deleting client:', error);
        throw error;
    }
};

export const getClient = async (id) => {
    const db = await initDB();
    return await db.get('clients', id);
};

export const getAllClients = async () => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('clients')) {
            console.error('Clients store does not exist!');
            // Try to restore from backup
            const backup = localStorage.getItem('clients_backup');
            if (backup) {
                console.log('Attempting to restore clients from localStorage backup');
                try {
                    const clients = JSON.parse(backup);
                    if (Array.isArray(clients) && clients.length > 0) {
                        console.log(`Found ${clients.length} clients in backup, attempting restore...`);
                        // Try to restore to IndexedDB
                        const tx = db.transaction('clients', 'readwrite');
                        for (const client of clients) {
                            try {
                                await tx.store.put(client);
                            } catch (e) {
                                console.warn('Failed to restore client:', e);
                            }
                        }
                        await tx.done;
                        return clients;
                    }
                } catch (e) {
                    console.error('Failed to restore from backup:', e);
                }
            }
            return [];
        }
        const clients = await db.getAll('clients');
        console.log(`Retrieved ${clients.length} clients from IndexedDB`);
        
        // Update backup
        if (clients.length > 0) {
            localStorage.setItem('clients_backup', JSON.stringify(clients));
        }
        
        return clients || [];
    } catch (error) {
        console.error('Error getting all clients:', error);
        // Try to restore from backup
        const backup = localStorage.getItem('clients_backup');
        if (backup) {
            try {
                const clients = JSON.parse(backup);
                console.log(`Restored ${clients.length} clients from localStorage backup`);
                return clients || [];
            } catch (e) {
                console.error('Failed to parse backup:', e);
            }
        }
        return [];
    }
};

export const addClientsBatch = async (clients) => {
    try {
        const db = await initDB();
        const tx = db.transaction('clients', 'readwrite');
        const store = tx.objectStore('clients');
        
        const newClients = clients.map(client => ({
            ...client,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }));
        
        await Promise.all(newClients.map(c => store.add(c)));
        await tx.done;
        
        console.log(`Saved ${newClients.length} clients to IndexedDB`);
        
        // Backup to localStorage
        try {
            const allClients = await db.getAll('clients');
            localStorage.setItem('clients_backup', JSON.stringify(allClients));
            console.log('Clients backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup clients to localStorage:', backupError);
        }
        
        return newClients;
    } catch (error) {
        console.error('Error adding clients batch:', error);
        throw error;
    }
};

// Exercise operations
export const addExercise = async (exercise) => {
    try {
        const db = await initDB();
        const id = generateId();
        const newExercise = {
            ...exercise,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.add('exercises', newExercise);
        console.log('Exercise saved to IndexedDB:', newExercise.name);
        
        // Backup to localStorage as well
        try {
            const allExercises = await db.getAll('exercises');
            localStorage.setItem('exercises_backup', JSON.stringify(allExercises));
            console.log('Exercise backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup exercise to localStorage:', backupError);
        }
        
        return newExercise;
    } catch (error) {
        console.error('Error adding exercise:', error);
        throw error;
    }
};

export const updateExercise = async (id, updates) => {
    try {
        const db = await initDB();
        const exercise = await db.get('exercises', id);
        if (!exercise) throw new Error('Exercise not found');

        const updatedExercise = {
            ...exercise,
            ...updates,
            id,
            updatedAt: Date.now(),
        };
        await db.put('exercises', updatedExercise);
        
        // Update backup
        try {
            const allExercises = await db.getAll('exercises');
            localStorage.setItem('exercises_backup', JSON.stringify(allExercises));
        } catch (backupError) {
            console.warn('Failed to update exercise backup:', backupError);
        }
        
        return updatedExercise;
    } catch (error) {
        console.error('Error updating exercise:', error);
        throw error;
    }
};

export const deleteExercise = async (id) => {
    try {
        const db = await initDB();
        await db.delete('exercises', id);
        
        // Update backup
        try {
            const allExercises = await db.getAll('exercises');
            localStorage.setItem('exercises_backup', JSON.stringify(allExercises));
        } catch (backupError) {
            console.warn('Failed to update exercise backup:', backupError);
        }
    } catch (error) {
        console.error('Error deleting exercise:', error);
        throw error;
    }
};

export const getExercise = async (id) => {
    const db = await initDB();
    return await db.get('exercises', id);
};

export const getAllExercises = async () => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('exercises')) {
            console.error('Exercises store does not exist!');
            // Try to restore from backup
            const backup = localStorage.getItem('exercises_backup');
            if (backup) {
                console.log('Attempting to restore exercises from localStorage backup');
                try {
                    const exercises = JSON.parse(backup);
                    if (Array.isArray(exercises) && exercises.length > 0) {
                        console.log(`Found ${exercises.length} exercises in backup, attempting restore...`);
                        // Try to restore to IndexedDB
                        const tx = db.transaction('exercises', 'readwrite');
                        for (const exercise of exercises) {
                            try {
                                await tx.store.put(exercise);
                            } catch (e) {
                                console.warn('Failed to restore exercise:', e);
                            }
                        }
                        await tx.done;
                        return exercises;
                    }
                } catch (e) {
                    console.error('Failed to restore from backup:', e);
                }
            }
            return [];
        }
        const exercises = await db.getAll('exercises');
        console.log(`Retrieved ${exercises.length} exercises from IndexedDB`);
        
        // Update backup
        if (exercises.length > 0) {
            localStorage.setItem('exercises_backup', JSON.stringify(exercises));
        }
        
        return exercises || [];
    } catch (error) {
        console.error('Error getting all exercises:', error);
        // Try to restore from backup
        const backup = localStorage.getItem('exercises_backup');
        if (backup) {
            try {
                const exercises = JSON.parse(backup);
                console.log(`Restored ${exercises.length} exercises from localStorage backup`);
                return exercises || [];
            } catch (e) {
                console.error('Failed to parse backup:', e);
            }
        }
        return [];
    }
};

export const addExercisesBatch = async (exercises) => {
    try {
        const db = await initDB();
        const tx = db.transaction('exercises', 'readwrite');
        const store = tx.objectStore('exercises');
        
        const newExercises = exercises.map(exercise => ({
            ...exercise,
            id: generateId(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        }));
        
        await Promise.all(newExercises.map(ex => store.add(ex)));
        await tx.done;
        
        console.log(`Saved ${newExercises.length} exercises to IndexedDB`);
        
        // Backup to localStorage
        try {
            const allExercises = await db.getAll('exercises');
            localStorage.setItem('exercises_backup', JSON.stringify(allExercises));
            console.log('Exercises backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup exercises to localStorage:', backupError);
        }
        
        return newExercises;
    } catch (error) {
        console.error('Error adding exercises batch:', error);
        throw error;
    }
};

// Workout operations
export const addWorkout = async (workout) => {
    try {
        const db = await initDB();
        const id = generateId();
        const newWorkout = {
            ...workout,
            id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.add('workouts', newWorkout);
        console.log('Workout saved for client:', workout.clientId);
        
        // Backup to localStorage as well
        try {
            const allWorkouts = await db.getAll('workouts');
            localStorage.setItem('workouts_backup', JSON.stringify(allWorkouts));
            console.log('Workout backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup workout to localStorage:', backupError);
        }
        
        return newWorkout;
    } catch (error) {
        console.error('Error adding workout:', error);
        throw error;
    }
};

export const updateWorkout = async (id, updates) => {
    const db = await initDB();
    const workout = await db.get('workouts', id);
    if (!workout) throw new Error('Workout not found');

    const updatedWorkout = {
        ...workout,
        ...updates,
        id,
        updatedAt: Date.now(),
    };
    await db.put('workouts', updatedWorkout);
    
    // Update backup
    try {
        const allWorkouts = await db.getAll('workouts');
        localStorage.setItem('workouts_backup', JSON.stringify(allWorkouts));
    } catch (backupError) {
        console.warn('Failed to update workout backup:', backupError);
    }
    
    return updatedWorkout;
};

export const deleteWorkout = async (id) => {
    const db = await initDB();
    await db.delete('workouts', id);
    
    // Update backup
    try {
        const allWorkouts = await db.getAll('workouts');
        localStorage.setItem('workouts_backup', JSON.stringify(allWorkouts));
    } catch (backupError) {
        console.warn('Failed to update workout backup:', backupError);
    }
};

export const getWorkout = async (id) => {
    const db = await initDB();
    return await db.get('workouts', id);
};

export const getAllWorkouts = async () => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('workouts')) {
            console.error('Workouts store does not exist!');
            // Try to restore from backup
            const backup = localStorage.getItem('workouts_backup');
            if (backup) {
                try {
                    const workouts = JSON.parse(backup);
                    if (Array.isArray(workouts) && workouts.length > 0) {
                        console.log(`Found ${workouts.length} workouts in backup, attempting restore...`);
                        // Try to restore to IndexedDB
                        const tx = db.transaction('workouts', 'readwrite');
                        for (const workout of workouts) {
                            try {
                                await tx.store.put(workout);
                            } catch (e) {
                                console.warn('Failed to restore workout:', e);
                            }
                        }
                        await tx.done;
                        return workouts;
                    }
                } catch (e) {
                    console.error('Failed to restore from backup:', e);
                }
            }
            return [];
        }
        const workouts = await db.getAll('workouts');
        console.log(`Retrieved ${workouts.length} workouts from database`);
        
        // Update backup
        if (workouts.length > 0) {
            localStorage.setItem('workouts_backup', JSON.stringify(workouts));
        }
        
        return workouts || [];
    } catch (error) {
        console.error('Error getting all workouts:', error);
        // Try to restore from backup
        const backup = localStorage.getItem('workouts_backup');
        if (backup) {
            try {
                const workouts = JSON.parse(backup);
                console.log(`Restored ${workouts.length} workouts from localStorage backup`);
                return workouts || [];
            } catch (e) {
                console.error('Failed to parse backup:', e);
            }
        }
        return [];
    }
};

export const getWorkoutsByDate = async (date) => {
    const db = await initDB();
    const index = db.transaction('workouts').store.index('date');
    return await index.getAll(date);
};

export const getWorkoutsByClient = async (clientId) => {
    const db = await initDB();
    const index = db.transaction('workouts').store.index('clientId');
    return await index.getAll(clientId);
};

// Measurement operations
export const addMeasurement = async (measurement) => {
    try {
        const db = await initDB();
        const id = generateId();
        const newMeasurement = {
            ...measurement,
            id,
            date: measurement.date || Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.add('measurements', newMeasurement);
        console.log('Measurement saved for client:', measurement.clientId);
        
        // Backup to localStorage
        try {
            const allMeasurements = await db.getAll('measurements');
            localStorage.setItem('measurements_backup', JSON.stringify(allMeasurements));
            console.log('Measurements backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup measurement to localStorage:', backupError);
        }
        
        return newMeasurement;
    } catch (error) {
        console.error('Error adding measurement:', error);
        throw error;
    }
};

export const updateMeasurement = async (id, updates) => {
    try {
        const db = await initDB();
        const measurement = await db.get('measurements', id);
        if (!measurement) throw new Error('Measurement not found');

        const updatedMeasurement = {
            ...measurement,
            ...updates,
            id,
            updatedAt: Date.now(),
        };
        await db.put('measurements', updatedMeasurement);
        
        // Update backup
        try {
            const allMeasurements = await db.getAll('measurements');
            localStorage.setItem('measurements_backup', JSON.stringify(allMeasurements));
        } catch (backupError) {
            console.warn('Failed to update measurement backup:', backupError);
        }
        
        return updatedMeasurement;
    } catch (error) {
        console.error('Error updating measurement:', error);
        throw error;
    }
};

export const deleteMeasurement = async (id) => {
    try {
        const db = await initDB();
        await db.delete('measurements', id);
        
        // Update backup
        try {
            const allMeasurements = await db.getAll('measurements');
            localStorage.setItem('measurements_backup', JSON.stringify(allMeasurements));
        } catch (backupError) {
            console.warn('Failed to update measurement backup:', backupError);
        }
    } catch (error) {
        console.error('Error deleting measurement:', error);
        throw error;
    }
};

export const getMeasurement = async (id) => {
    const db = await initDB();
    return await db.get('measurements', id);
};

export const getAllMeasurements = async () => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('measurements')) {
            console.error('Measurements store does not exist!');
            // Try to restore from backup
            const backup = localStorage.getItem('measurements_backup');
            if (backup) {
                try {
                    const measurements = JSON.parse(backup);
                    if (Array.isArray(measurements) && measurements.length > 0) {
                        console.log(`Found ${measurements.length} measurements in backup, attempting restore...`);
                        return measurements;
                    }
                } catch (e) {
                    console.error('Failed to restore from backup:', e);
                }
            }
            return [];
        }
        const measurements = await db.getAll('measurements');
        console.log(`Retrieved ${measurements.length} measurements from IndexedDB`);
        
        // Update backup
        if (measurements.length > 0) {
            localStorage.setItem('measurements_backup', JSON.stringify(measurements));
        }
        
        return measurements || [];
    } catch (error) {
        console.error('Error getting all measurements:', error);
        // Try to restore from backup
        const backup = localStorage.getItem('measurements_backup');
        if (backup) {
            try {
                const measurements = JSON.parse(backup);
                console.log(`Restored ${measurements.length} measurements from localStorage backup`);
                return measurements || [];
            } catch (e) {
                console.error('Failed to parse backup:', e);
            }
        }
        return [];
    }
};

export const getMeasurementsByClient = async (clientId) => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('measurements')) {
            return [];
        }
        const index = db.transaction('measurements').store.index('clientId');
        const measurements = await index.getAll(clientId);
        return measurements || [];
    } catch (error) {
        console.error('Error getting measurements by client:', error);
        return [];
    }
};

// Database health check
export const checkDatabaseHealth = async () => {
    try {
        const db = await initDB();
        const stores = Array.from(db.objectStoreNames);
        console.log('Database stores:', stores);
        
        const [clientsCount, exercisesCount, workoutsCount, measurementsCount] = await Promise.all([
            db.count('clients'),
            db.count('exercises'),
            db.count('workouts'),
            db.count('measurements'),
        ]);
        
        console.log(`Database health check: ${clientsCount} clients, ${exercisesCount} exercises, ${workoutsCount} workouts, ${measurementsCount} measurements`);
        
        return {
            stores,
            counts: {
                clients: clientsCount,
                exercises: exercisesCount,
                workouts: workoutsCount,
                measurements: measurementsCount,
            }
        };
    } catch (error) {
        console.error('Database health check failed:', error);
        return null;
    }
};

// Export all data for backup
export const exportAllData = async () => {
    try {
        const [clients, exercises, workouts, measurements] = await Promise.all([
            getAllClients(),
            getAllExercises(),
            getAllWorkouts(),
            getAllMeasurements(),
        ]);

        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            data: {
                clients,
                exercises,
                workouts,
                measurements,
            },
        };

        return exportData;
    } catch (error) {
        console.error('Error exporting data:', error);
        throw error;
    }
};

// Import data from backup
export const importAllData = async (importData, options = { overwrite: false }) => {
    try {
        const { data } = importData;
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid import data format');
        }

        const results = {
            clients: { imported: 0, errors: 0 },
            exercises: { imported: 0, errors: 0 },
            workouts: { imported: 0, errors: 0 },
            measurements: { imported: 0, errors: 0 },
        };

        // Import clients
        if (Array.isArray(data.clients)) {
            for (const client of data.clients) {
                try {
                    if (options.overwrite) {
                        await updateClient(client.id, client);
                    } else {
                        // Check if client exists
                        const existing = await getClient(client.id);
                        if (!existing) {
                            await addClient(client);
                        }
                    }
                    results.clients.imported++;
                } catch (error) {
                    console.error('Error importing client:', error);
                    results.clients.errors++;
                }
            }
        }

        // Import exercises
        if (Array.isArray(data.exercises)) {
            for (const exercise of data.exercises) {
                try {
                    if (options.overwrite) {
                        await updateExercise(exercise.id, exercise);
                    } else {
                        const existing = await getExercise(exercise.id);
                        if (!existing) {
                            await addExercise(exercise);
                        }
                    }
                    results.exercises.imported++;
                } catch (error) {
                    console.error('Error importing exercise:', error);
                    results.exercises.errors++;
                }
            }
        }

        // Import workouts
        if (Array.isArray(data.workouts)) {
            for (const workout of data.workouts) {
                try {
                    if (options.overwrite) {
                        await updateWorkout(workout.id, workout);
                    } else {
                        const existing = await getWorkout(workout.id);
                        if (!existing) {
                            await addWorkout(workout);
                        }
                    }
                    results.workouts.imported++;
                } catch (error) {
                    console.error('Error importing workout:', error);
                    results.workouts.errors++;
                }
            }
        }

        // Import measurements
        if (Array.isArray(data.measurements)) {
            for (const measurement of data.measurements) {
                try {
                    if (options.overwrite) {
                        await updateMeasurement(measurement.id, measurement);
                    } else {
                        const existing = await getMeasurement(measurement.id);
                        if (!existing) {
                            await addMeasurement(measurement);
                        }
                    }
                    results.measurements.imported++;
                } catch (error) {
                    console.error('Error importing measurement:', error);
                    results.measurements.errors++;
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
};

// Workout Template operations
export const addWorkoutTemplate = async (template) => {
    try {
        const db = await initDB();
        const id = generateId();
        const newTemplate = {
            ...template,
            id,
            name: template.name || 'Unnamed Workout',
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        await db.add('workoutTemplates', newTemplate);
        console.log('Workout template saved:', newTemplate.name);
        
        // Backup to localStorage
        try {
            const allTemplates = await db.getAll('workoutTemplates');
            localStorage.setItem('workoutTemplates_backup', JSON.stringify(allTemplates));
            console.log('Workout templates backup saved to localStorage');
        } catch (backupError) {
            console.warn('Failed to backup workout template to localStorage:', backupError);
        }
        
        return newTemplate;
    } catch (error) {
        console.error('Error adding workout template:', error);
        throw error;
    }
};

export const updateWorkoutTemplate = async (id, updates) => {
    try {
        const db = await initDB();
        const template = await db.get('workoutTemplates', id);
        if (!template) throw new Error('Workout template not found');

        const updatedTemplate = {
            ...template,
            ...updates,
            id,
            updatedAt: Date.now(),
        };
        await db.put('workoutTemplates', updatedTemplate);
        
        // Update backup
        try {
            const allTemplates = await db.getAll('workoutTemplates');
            localStorage.setItem('workoutTemplates_backup', JSON.stringify(allTemplates));
        } catch (backupError) {
            console.warn('Failed to backup workout template to localStorage:', backupError);
        }
        
        return updatedTemplate;
    } catch (error) {
        console.error('Error updating workout template:', error);
        throw error;
    }
};

export const deleteWorkoutTemplate = async (id) => {
    try {
        const db = await initDB();
        await db.delete('workoutTemplates', id);
        console.log('Workout template deleted:', id);
        
        // Update backup
        try {
            const allTemplates = await db.getAll('workoutTemplates');
            localStorage.setItem('workoutTemplates_backup', JSON.stringify(allTemplates));
        } catch (backupError) {
            console.warn('Failed to backup workout template to localStorage:', backupError);
        }
    } catch (error) {
        console.error('Error deleting workout template:', error);
        throw error;
    }
};

export const getWorkoutTemplate = async (id) => {
    const db = await initDB();
    return await db.get('workoutTemplates', id);
};

export const getAllWorkoutTemplates = async () => {
    try {
        const db = await initDB();
        if (!db.objectStoreNames.contains('workoutTemplates')) {
            // Try to restore from backup
            const backup = localStorage.getItem('workoutTemplates_backup');
            if (backup) {
                try {
                    const templates = JSON.parse(backup);
                    if (Array.isArray(templates) && templates.length > 0) {
                        console.log(`Found ${templates.length} workout templates in backup, attempting restore...`);
                        // Try to restore to IndexedDB
                        const tx = db.transaction('workoutTemplates', 'readwrite');
                        for (const template of templates) {
                            try {
                                await tx.store.put(template);
                            } catch (e) {
                                console.warn('Failed to restore workout template:', e);
                            }
                        }
                        await tx.done;
                        return templates;
                    }
                } catch (e) {
                    console.error('Failed to restore from backup:', e);
                }
            }
            return [];
        }
        const templates = await db.getAll('workoutTemplates');
        console.log(`Retrieved ${templates.length} workout templates from database`);
        
        // Update backup
        if (templates.length > 0) {
            localStorage.setItem('workoutTemplates_backup', JSON.stringify(templates));
        }
        
        return templates || [];
    } catch (error) {
        console.error('Error getting all workout templates:', error);
        // Try to restore from backup
        const backup = localStorage.getItem('workoutTemplates_backup');
        if (backup) {
            try {
                const templates = JSON.parse(backup);
                console.log(`Restored ${templates.length} workout templates from localStorage backup`);
                return templates || [];
            } catch (e) {
                console.error('Failed to parse backup:', e);
            }
        }
        return [];
    }
};
