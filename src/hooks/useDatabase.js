import { useState, useEffect } from 'react';
import * as supabaseDb from '../utils/supabase';
import * as indexedDb from '../utils/db';
import { withErrorHandling } from '../utils/errorHandler';

// Check if Supabase is configured, otherwise fall back to IndexedDB
const getDatabase = () => {
  if (supabaseDb.isSupabaseConfigured) {
    console.log('Using Supabase database');
    return supabaseDb;
  } else {
    console.log('Supabase not configured, using IndexedDB');
    return indexedDb;
  }
};

export const useDatabase = () => {
    const [clients, setClients] = useState([]);
    const [exercises, setExercises] = useState([]);
    const [workouts, setWorkouts] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [workoutTemplates, setWorkoutTemplates] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load all data on mount
    useEffect(() => {
        const initialize = async () => {
            const db = getDatabase();
            // Check database health first (if available)
            if (db.checkDatabaseHealth) {
                await db.checkDatabaseHealth();
            }
            // Then load data
            await loadData();
        };
        initialize();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const db = getDatabase();
            console.log('Loading data from database...');
            const [clientsData, exercisesData, workoutsData, measurementsData, templatesData] = await Promise.all([
                withErrorHandling(() => db.getAllClients(), { errorMessage: 'Failed to load clients' }),
                withErrorHandling(() => db.getAllExercises(), { errorMessage: 'Failed to load exercises' }),
                withErrorHandling(() => db.getAllWorkouts(), { errorMessage: 'Failed to load workouts' }),
                withErrorHandling(() => db.getAllMeasurements(), { errorMessage: 'Failed to load measurements' }),
                withErrorHandling(() => db.getAllWorkoutTemplates(), { errorMessage: 'Failed to load workout templates' }),
            ]);
            console.log(`Loaded: ${clientsData.length} clients, ${exercisesData.length} exercises, ${workoutsData.length} workouts, ${measurementsData.length} measurements, ${templatesData.length} workout templates`);
            setClients(clientsData || []);
            setExercises(exercisesData || []);
            setWorkouts(workoutsData || []);
            setMeasurements(measurementsData || []);
            setWorkoutTemplates(templatesData || []);
        } catch (error) {
            console.error('Error loading data:', error);
            // Set empty arrays on error to prevent crashes
            setClients([]);
            setExercises([]);
            setWorkouts([]);
            setMeasurements([]);
            setWorkoutTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    // Client methods
    const createClient = async (clientData) => {
        const db = getDatabase();
        const newClient = await withErrorHandling(
            () => db.addClient(clientData),
            { 
                errorMessage: 'Failed to create client',
                successMessage: 'Client created successfully'
            }
        );
        setClients(prev => [...prev, newClient]);
        return newClient;
    };

    const modifyClient = async (id, updates) => {
        const db = getDatabase();
        const updatedClient = await withErrorHandling(
            () => db.updateClient(id, updates),
            { 
                errorMessage: 'Failed to update client',
                successMessage: 'Client updated successfully'
            }
        );
        setClients(prev => prev.map(c => c.id === id ? updatedClient : c));
        return updatedClient;
    };

    const removeClient = async (id) => {
        const db = getDatabase();
        await withErrorHandling(
            () => db.deleteClient(id),
            { 
                errorMessage: 'Failed to delete client',
                successMessage: 'Client deleted successfully'
            }
        );
        setClients(prev => prev.filter(c => c.id !== id));
    };

    const importClientsBatch = async (clientsData) => {
        const db = getDatabase();
        const newClients = await withErrorHandling(
            () => db.addClientsBatch(clientsData),
            { 
                errorMessage: 'Failed to import clients',
                successMessage: `Successfully imported ${clientsData.length} client(s)`
            }
        );
        setClients(prev => [...prev, ...newClients]);
        return newClients;
    };

    // Exercise methods
    const createExercise = async (exerciseData) => {
        const db = getDatabase();
        const newExercise = await withErrorHandling(
            () => db.addExercise(exerciseData),
            { 
                errorMessage: 'Failed to create exercise',
                successMessage: 'Exercise created successfully'
            }
        );
        setExercises(prev => [...prev, newExercise]);
        return newExercise;
    };

    const modifyExercise = async (id, updates) => {
        const db = getDatabase();
        const updatedExercise = await withErrorHandling(
            () => db.updateExercise(id, updates),
            { 
                errorMessage: 'Failed to update exercise',
                successMessage: 'Exercise updated successfully'
            }
        );
        setExercises(prev => prev.map(e => e.id === id ? updatedExercise : e));
        return updatedExercise;
    };

    const removeExercise = async (id) => {
        const db = getDatabase();
        await withErrorHandling(
            () => db.deleteExercise(id),
            { 
                errorMessage: 'Failed to delete exercise',
                successMessage: 'Exercise deleted successfully'
            }
        );
        setExercises(prev => prev.filter(e => e.id !== id));
    };

    const importExercisesBatch = async (exercisesData) => {
        const db = getDatabase();
        const newExercises = await withErrorHandling(
            () => db.addExercisesBatch(exercisesData),
            { 
                errorMessage: 'Failed to import exercises',
                successMessage: `Successfully imported ${exercisesData.length} exercise(s)`
            }
        );
        setExercises(prev => [...prev, ...newExercises]);
        return newExercises;
    };

    // Workout methods
    const createWorkout = async (workoutData) => {
        const db = getDatabase();
        const newWorkout = await withErrorHandling(
            () => db.addWorkout(workoutData),
            { 
                errorMessage: 'Failed to create workout',
                successMessage: 'Workout created successfully'
            }
        );
        setWorkouts(prev => [...prev, newWorkout]);
        return newWorkout;
    };

    const modifyWorkout = async (id, updates) => {
        const db = getDatabase();
        const updatedWorkout = await withErrorHandling(
            () => db.updateWorkout(id, updates),
            { 
                errorMessage: 'Failed to update workout',
                successMessage: 'Workout updated successfully'
            }
        );
        setWorkouts(prev => prev.map(w => w.id === id ? updatedWorkout : w));
        return updatedWorkout;
    };

    const removeWorkout = async (id) => {
        const db = getDatabase();
        await withErrorHandling(
            () => db.deleteWorkout(id),
            { 
                errorMessage: 'Failed to delete workout',
                successMessage: 'Workout deleted successfully'
            }
        );
        setWorkouts(prev => prev.filter(w => w.id !== id));
    };

    const getWorkoutsByDate = (date) => {
        return workouts.filter(w => w.date === date);
    };

    const getWorkoutsByClient = (clientId) => {
        return workouts.filter(w => w.clientId === clientId);
    };

    // Measurement methods
    const createMeasurement = async (measurementData) => {
        const db = getDatabase();
        const newMeasurement = await withErrorHandling(
            () => db.addMeasurement(measurementData),
            { 
                errorMessage: 'Failed to create measurement',
                successMessage: 'Measurement saved successfully'
            }
        );
        setMeasurements(prev => [...prev, newMeasurement]);
        return newMeasurement;
    };

    const modifyMeasurement = async (id, updates) => {
        const db = getDatabase();
        const updatedMeasurement = await withErrorHandling(
            () => db.updateMeasurement(id, updates),
            { 
                errorMessage: 'Failed to update measurement',
                successMessage: 'Measurement updated successfully'
            }
        );
        setMeasurements(prev => prev.map(m => m.id === id ? updatedMeasurement : m));
        return updatedMeasurement;
    };

    const removeMeasurement = async (id) => {
        const db = getDatabase();
        await withErrorHandling(
            () => db.deleteMeasurement(id),
            { 
                errorMessage: 'Failed to delete measurement',
                successMessage: 'Measurement deleted successfully'
            }
        );
        setMeasurements(prev => prev.filter(m => m.id !== id));
    };

    const getMeasurementsByClient = async (clientId) => {
        const db = getDatabase();
        const clientMeasurements = await db.getMeasurementsByClient(clientId);
        return clientMeasurements || [];
    };

    // Workout Template methods
    const createWorkoutTemplate = async (templateData) => {
        const db = getDatabase();
        const newTemplate = await withErrorHandling(
            () => db.addWorkoutTemplate(templateData),
            { 
                errorMessage: 'Failed to create workout template',
                successMessage: 'Workout template saved to library'
            }
        );
        setWorkoutTemplates(prev => [...prev, newTemplate]);
        return newTemplate;
    };

    const modifyWorkoutTemplate = async (id, updates) => {
        const db = getDatabase();
        const updatedTemplate = await withErrorHandling(
            () => db.updateWorkoutTemplate(id, updates),
            { 
                errorMessage: 'Failed to update workout template',
                successMessage: 'Workout template updated successfully'
            }
        );
        setWorkoutTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t));
        return updatedTemplate;
    };

    const removeWorkoutTemplate = async (id) => {
        const db = getDatabase();
        await withErrorHandling(
            () => db.deleteWorkoutTemplate(id),
            { 
                errorMessage: 'Failed to delete workout template',
                successMessage: 'Workout template deleted successfully'
            }
        );
        setWorkoutTemplates(prev => prev.filter(t => t.id !== id));
    };

    return {
        // Data
        clients,
        exercises,
        workouts,
        measurements,
        workoutTemplates,
        loading,

        // Client methods
        createClient,
        modifyClient,
        removeClient,
        importClientsBatch,

        // Exercise methods
        createExercise,
        modifyExercise,
        removeExercise,
        importExercisesBatch,

        // Workout methods
        createWorkout,
        modifyWorkout,
        removeWorkout,
        getWorkoutsByDate,
        getWorkoutsByClient,

        // Measurement methods
        createMeasurement,
        modifyMeasurement,
        removeMeasurement,
        getMeasurementsByClient,

        // Workout Template methods
        createWorkoutTemplate,
        modifyWorkoutTemplate,
        removeWorkoutTemplate,

        // Utility
        refresh: loadData,
    };
};
