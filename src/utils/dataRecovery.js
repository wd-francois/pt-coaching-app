// Data Recovery Utility
// This utility helps recover lost data from localStorage backups

export const checkForBackups = () => {
    const backups = {
        clients: null,
        exercises: null,
        workouts: null,
        measurements: null,
    };

    try {
        const clientsBackup = localStorage.getItem('clients_backup');
        if (clientsBackup) {
            try {
                backups.clients = JSON.parse(clientsBackup);
            } catch (e) {
                console.error('Failed to parse clients backup:', e);
            }
        }
    } catch (e) {
        console.error('Error checking clients backup:', e);
    }

    try {
        const exercisesBackup = localStorage.getItem('exercises_backup');
        if (exercisesBackup) {
            try {
                backups.exercises = JSON.parse(exercisesBackup);
            } catch (e) {
                console.error('Failed to parse exercises backup:', e);
            }
        }
    } catch (e) {
        console.error('Error checking exercises backup:', e);
    }

    try {
        const workoutsBackup = localStorage.getItem('workouts_backup');
        if (workoutsBackup) {
            try {
                backups.workouts = JSON.parse(workoutsBackup);
            } catch (e) {
                console.error('Failed to parse workouts backup:', e);
            }
        }
    } catch (e) {
        console.error('Error checking workouts backup:', e);
    }

    try {
        const measurementsBackup = localStorage.getItem('measurements_backup');
        if (measurementsBackup) {
            try {
                backups.measurements = JSON.parse(measurementsBackup);
            } catch (e) {
                console.error('Failed to parse measurements backup:', e);
            }
        }
    } catch (e) {
        console.error('Error checking measurements backup:', e);
    }

    return {
        hasBackups: !!(backups.clients || backups.exercises || backups.workouts || backups.measurements),
        backups,
        summary: {
            clients: backups.clients?.length || 0,
            exercises: backups.exercises?.length || 0,
            workouts: backups.workouts?.length || 0,
            measurements: backups.measurements?.length || 0,
        }
    };
};

export const restoreFromBackups = async (options = { restoreAll: true }) => {
    const { restoreAll } = options;
    const results = {
        clients: { restored: 0, errors: 0 },
        exercises: { restored: 0, errors: 0 },
        workouts: { restored: 0, errors: 0 },
        measurements: { restored: 0, errors: 0 },
    };

    try {
        const { openDB } = await import('idb');
        const { DB_NAME, DB_VERSION } = await import('./db.js');
        const db = await openDB(DB_NAME, DB_VERSION);

        // Restore clients
        if (restoreAll || options.restoreClients) {
            const clientsBackup = localStorage.getItem('clients_backup');
            if (clientsBackup) {
                try {
                    const clients = JSON.parse(clientsBackup);
                    if (Array.isArray(clients) && clients.length > 0) {
                        const tx = db.transaction('clients', 'readwrite');
                        for (const client of clients) {
                            try {
                                await tx.store.put(client);
                                results.clients.restored++;
                            } catch (e) {
                                console.error('Failed to restore client:', e);
                                results.clients.errors++;
                            }
                        }
                        await tx.done;
                    }
                } catch (e) {
                    console.error('Failed to restore clients:', e);
                    results.clients.errors++;
                }
            }
        }

        // Restore exercises
        if (restoreAll || options.restoreExercises) {
            const exercisesBackup = localStorage.getItem('exercises_backup');
            if (exercisesBackup) {
                try {
                    const exercises = JSON.parse(exercisesBackup);
                    if (Array.isArray(exercises) && exercises.length > 0) {
                        const tx = db.transaction('exercises', 'readwrite');
                        for (const exercise of exercises) {
                            try {
                                await tx.store.put(exercise);
                                results.exercises.restored++;
                            } catch (e) {
                                console.error('Failed to restore exercise:', e);
                                results.exercises.errors++;
                            }
                        }
                        await tx.done;
                    }
                } catch (e) {
                    console.error('Failed to restore exercises:', e);
                    results.exercises.errors++;
                }
            }
        }

        // Restore workouts
        if (restoreAll || options.restoreWorkouts) {
            const workoutsBackup = localStorage.getItem('workouts_backup');
            if (workoutsBackup) {
                try {
                    const workouts = JSON.parse(workoutsBackup);
                    if (Array.isArray(workouts) && workouts.length > 0) {
                        const tx = db.transaction('workouts', 'readwrite');
                        for (const workout of workouts) {
                            try {
                                await tx.store.put(workout);
                                results.workouts.restored++;
                            } catch (e) {
                                console.error('Failed to restore workout:', e);
                                results.workouts.errors++;
                            }
                        }
                        await tx.done;
                    }
                } catch (e) {
                    console.error('Failed to restore workouts:', e);
                    results.workouts.errors++;
                }
            }
        }

        // Restore measurements
        if (restoreAll || options.restoreMeasurements) {
            const measurementsBackup = localStorage.getItem('measurements_backup');
            if (measurementsBackup) {
                try {
                    const measurements = JSON.parse(measurementsBackup);
                    if (Array.isArray(measurements) && measurements.length > 0) {
                        const tx = db.transaction('measurements', 'readwrite');
                        for (const measurement of measurements) {
                            try {
                                await tx.store.put(measurement);
                                results.measurements.restored++;
                            } catch (e) {
                                console.error('Failed to restore measurement:', e);
                                results.measurements.errors++;
                            }
                        }
                        await tx.done;
                    }
                } catch (e) {
                    console.error('Failed to restore measurements:', e);
                    results.measurements.errors++;
                }
            }
        }

        return results;
    } catch (error) {
        console.error('Error restoring from backups:', error);
        throw error;
    }
};

export const exportBackupsToFile = () => {
    const backups = checkForBackups();
    const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        source: 'localStorage_backups',
        data: {
            clients: backups.backups.clients || [],
            exercises: backups.backups.exercises || [],
            workouts: backups.backups.workouts || [],
            measurements: backups.backups.measurements || [],
        },
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pt-coaching-recovery-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return exportData;
};

