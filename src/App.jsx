import { useState, useEffect } from 'react';
import { useDatabase } from './hooks/useDatabase';
import { Calendar } from './components/Calendar/Calendar';
import { ClientList } from './components/Clients/ClientList';
import { ClientDetail } from './components/Clients/ClientDetail';
import { ExerciseList } from './components/Exercises/ExerciseList';
import { Admin } from './components/Admin/Admin';
import { SignUpFormStandalone } from './components/Admin/SignUpFormStandalone';
import { WorkoutLibraryView } from './components/Workouts/WorkoutLibraryView';
import { checkForBackups, restoreFromBackups } from './utils/dataRecovery';

function App() {
  // Check if we should show the standalone signup form
  const [showSignupForm, setShowSignupForm] = useState(false);

  useEffect(() => {
    // Check URL parameters for signup form
    const params = new URLSearchParams(window.location.search);
    if (params.get('form') === 'signup') {
      setShowSignupForm(true);
    }
  }, []);
  const [activeView, setActiveView] = useState('calendar');
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [recovering, setRecovering] = useState(false);
  const [showRecoveryBanner, setShowRecoveryBanner] = useState(false);
  const [showNoDataNotice, setShowNoDataNotice] = useState(true);
  const {
    clients,
    exercises,
    workouts,
    workoutTemplates,
    loading,
    createClient,
    modifyClient,
    removeClient,
    importClientsBatch,
    createExercise,
    modifyExercise,
    removeExercise,
    importExercisesBatch,
    createWorkout,
    modifyWorkout,
    removeWorkout,
    createMeasurement,
    modifyMeasurement,
    removeMeasurement,
    getMeasurementsByClient,
    createWorkoutTemplate,
    modifyWorkoutTemplate,
    removeWorkoutTemplate,
    refresh,
  } = useDatabase();

  // Check for backups on mount and when data changes
  useEffect(() => {
    const status = checkForBackups();
    setBackupStatus(status);
    // Show banner if backups exist and current data is empty
    const hasData = clients.length > 0 || exercises.length > 0 || workouts.length > 0;
    setShowRecoveryBanner(status.hasBackups && !hasData);
    
    // Check if no data notice should be shown
    if (!hasData && !status.hasBackups && !loading) {
      const dismissed = sessionStorage.getItem('dismissedNoDataNotice');
      setShowNoDataNotice(!dismissed);
      
      // Auto-dismiss after 15 seconds
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowNoDataNotice(false);
          sessionStorage.setItem('dismissedNoDataNotice', 'true');
        }, 15000);
        return () => clearTimeout(timer);
      }
    } else {
      setShowNoDataNotice(false);
    }
  }, [clients.length, exercises.length, workouts.length, loading]);

  const handleRecoverData = async () => {
    if (!backupStatus?.hasBackups) {
      alert('No backups found in localStorage.');
      return;
    }

    const confirmed = window.confirm(
      `Found backups:\n` +
      `- ${backupStatus.summary.clients} clients\n` +
      `- ${backupStatus.summary.exercises} exercises\n` +
      `- ${backupStatus.summary.workouts} workouts\n` +
      `- ${backupStatus.summary.measurements} measurements\n\n` +
      `This will restore data from localStorage backups. Continue?`
    );

    if (!confirmed) return;

    try {
      setRecovering(true);
      const results = await restoreFromBackups({ restoreAll: true });
      
      const summary = [
        `Clients: ${results.clients.restored} restored, ${results.clients.errors} errors`,
        `Exercises: ${results.exercises.restored} restored, ${results.exercises.errors} errors`,
        `Workouts: ${results.workouts.restored} restored, ${results.workouts.errors} errors`,
        `Measurements: ${results.measurements.restored} restored, ${results.measurements.errors} errors`,
      ].join('\n');

      alert(`Recovery completed!\n\n${summary}\n\nRefreshing data...`);
      
      // Refresh data from database
      await refresh();
      
      // Update backup status
      const newStatus = checkForBackups();
      setBackupStatus(newStatus);
      setShowRecoveryBanner(false);
    } catch (error) {
      console.error('Error recovering data:', error);
      alert('Failed to recover data. Please check the console for details.');
    } finally {
      setRecovering(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-white text-2xl font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  // If showing signup form, render it full page without navigation
  if (showSignupForm) {
    return <SignUpFormStandalone />;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Recovery Banner */}
      {showRecoveryBanner && backupStatus?.hasBackups && (
        <div className="fixed top-0 left-0 right-0 z-50 glass border-b-2 border-yellow-500/50 bg-yellow-900/20 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <svg className="w-6 h-6 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-yellow-400">Data Recovery Available</h3>
                  <p className="text-sm text-gray-200 mt-1">
                    Found backups: {backupStatus.summary.clients} clients, {backupStatus.summary.exercises} exercises, {backupStatus.summary.workouts} workouts, {backupStatus.summary.measurements} measurements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRecoverData}
                  disabled={recovering}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {recovering ? 'Recovering...' : 'Recover Data'}
                </button>
                <button
                  onClick={() => setShowRecoveryBanner(false)}
                  className="p-2 text-gray-200 hover:text-white transition-colors"
                  aria-label="Dismiss recovery banner"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browser Storage Notice - Show when no data and no backups */}
      {!loading && clients.length === 0 && exercises.length === 0 && workouts.length === 0 && !backupStatus?.hasBackups && showNoDataNotice && (
        <div className="fixed top-0 left-0 right-0 z-40 glass border-b-2 border-blue-500/50 bg-blue-900/20 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <svg className="w-6 h-6 text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-blue-400">No Data Found</h3>
                  <p className="text-sm text-gray-200 mt-1">
                    Data is stored per browser. If you have data in another browser, export it there and import it here using the Admin page.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveView('admin');
                    setShowNoDataNotice(false);
                    sessionStorage.setItem('dismissedNoDataNotice', 'true');
                  }}
                  className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-base transition-colors min-h-[44px]"
                >
                  Go to Admin
                </button>
                <button
                  onClick={() => {
                    setShowNoDataNotice(false);
                    sessionStorage.setItem('dismissedNoDataNotice', 'true');
                  }}
                  className="p-2 text-gray-200 hover:text-white transition-colors"
                  aria-label="Dismiss notice"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar Navigation */}
      <nav className="lg:w-72 glass border-r border-white/10">
        <div className="p-7">
          <h1 className="text-3xl font-bold gradient-text mb-9">PT Coach</h1>

          <div className="space-y-1.5">
            <button
              onClick={() => setActiveView('calendar')}
              aria-label="Navigate to Calendar view"
              aria-current={activeView === 'calendar' ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${activeView === 'calendar'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
                }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveView('clients')}
              aria-label={`Navigate to Clients view, ${clients.length} clients`}
              aria-current={activeView === 'clients' ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${activeView === 'clients'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
                }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>Clients</span>
            </button>

            <button
              onClick={() => setActiveView('exercises')}
              aria-label={`Navigate to Exercises view, ${exercises.length} exercises`}
              aria-current={activeView === 'exercises' ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${activeView === 'exercises'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
                }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Exercises</span>
            </button>

            <button
              onClick={() => setActiveView('workoutLibrary')}
              aria-label={`Navigate to Workouts view, ${workoutTemplates.length} workout templates`}
              aria-current={activeView === 'workoutLibrary' ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${activeView === 'workoutLibrary'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
                }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Workouts</span>
            </button>

            <button
              onClick={() => setActiveView('admin')}
              aria-label="Navigate to Admin view"
              aria-current={activeView === 'admin' ? 'page' : undefined}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-lg font-semibold ${activeView === 'admin'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-200 hover:bg-white/10'
                }`}
            >
              <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Admin</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className={`flex-1 p-7 lg:p-10 overflow-auto ${showRecoveryBanner ? 'pt-20' : ''}`}>
        {activeView === 'calendar' && (
          <Calendar
            workouts={workouts}
            clients={clients}
            exercises={exercises}
            onCreateWorkout={createWorkout}
            onUpdateWorkout={modifyWorkout}
            onDeleteWorkout={removeWorkout}
            workoutTemplates={workoutTemplates}
            onCreateWorkoutTemplate={createWorkoutTemplate}
            onUpdateWorkoutTemplate={modifyWorkoutTemplate}
            onDeleteWorkoutTemplate={removeWorkoutTemplate}
            onCreatePersonalBest={async (personalBestData) => {
              // Store Personal Best in client's data
              if (!personalBestData.clientId) {
                alert('Client information is required to save Personal Best.');
                return;
              }
              
              // Store Personal Best in localStorage
              // In a full implementation, this would be stored in the database
              try {
                const existingPBs = JSON.parse(localStorage.getItem(`personalBests_${personalBestData.clientId}`) || '[]');
                const newPB = {
                  ...personalBestData,
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                };
                existingPBs.push(newPB);
                localStorage.setItem(`personalBests_${personalBestData.clientId}`, JSON.stringify(existingPBs));
                
                // Show success message
                console.log(`Personal Best saved: ${personalBestData.exerciseName} - ${personalBestData.reps} reps @ ${personalBestData.weight}`);
              } catch (error) {
                console.error('Error saving Personal Best:', error);
                alert('Failed to save Personal Best. Please try again.');
              }
            }}
            onDeletePersonalBest={async (personalBestId, clientId) => {
              // Remove Personal Best from localStorage
              try {
                const existingPBs = JSON.parse(localStorage.getItem(`personalBests_${clientId}`) || '[]');
                const updatedPBs = existingPBs.filter(pb => pb.id !== personalBestId);
                localStorage.setItem(`personalBests_${clientId}`, JSON.stringify(updatedPBs));
                
                console.log(`Personal Best removed: ${personalBestId}`);
              } catch (error) {
                console.error('Error removing Personal Best:', error);
                alert('Failed to remove Personal Best. Please try again.');
              }
            }}
          />
        )}

        {activeView === 'clients' && (
          <ClientList
            clients={clients}
            onAdd={createClient}
            onUpdate={modifyClient}
            onDelete={removeClient}
            onImportBatch={importClientsBatch}
            onCreateMeasurement={createMeasurement}
            onUpdateMeasurement={modifyMeasurement}
            onDeleteMeasurement={removeMeasurement}
            getMeasurementsByClient={getMeasurementsByClient}
            onViewClient={(clientId) => {
              setSelectedClientId(clientId);
              setActiveView('clientDetail');
            }}
          />
        )}

        {activeView === 'clientDetail' && (
          <ClientDetail
            client={clients.find(c => c.id === selectedClientId)}
            workouts={workouts}
            exercises={exercises}
            onCreateMeasurement={createMeasurement}
            onUpdateMeasurement={modifyMeasurement}
            onDeleteMeasurement={removeMeasurement}
            getMeasurementsByClient={getMeasurementsByClient}
            onCreatePersonalBest={async (personalBestData) => {
              if (!personalBestData.clientId) {
                alert('Client information is required to save Personal Best.');
                return;
              }
              try {
                const existingPBs = JSON.parse(localStorage.getItem(`personalBests_${personalBestData.clientId}`) || '[]');
                const newPB = {
                  ...personalBestData,
                  id: crypto.randomUUID(),
                  createdAt: Date.now(),
                };
                existingPBs.push(newPB);
                localStorage.setItem(`personalBests_${personalBestData.clientId}`, JSON.stringify(existingPBs));
              } catch (error) {
                console.error('Error saving Personal Best:', error);
                alert('Failed to save Personal Best. Please try again.');
              }
            }}
            onUpdatePersonalBest={async (personalBestId, personalBestData) => {
              if (!personalBestData.clientId) {
                alert('Client information is required to update Personal Best.');
                return;
              }
              try {
                const existingPBs = JSON.parse(localStorage.getItem(`personalBests_${personalBestData.clientId}`) || '[]');
                const updatedPBs = existingPBs.map(pb => 
                  pb.id === personalBestId ? { ...pb, ...personalBestData } : pb
                );
                localStorage.setItem(`personalBests_${personalBestData.clientId}`, JSON.stringify(updatedPBs));
              } catch (error) {
                console.error('Error updating Personal Best:', error);
                alert('Failed to update Personal Best. Please try again.');
              }
            }}
            onDeletePersonalBest={async (personalBestId, clientId) => {
              try {
                const existingPBs = JSON.parse(localStorage.getItem(`personalBests_${clientId}`) || '[]');
                const updatedPBs = existingPBs.filter(pb => pb.id !== personalBestId);
                localStorage.setItem(`personalBests_${clientId}`, JSON.stringify(updatedPBs));
              } catch (error) {
                console.error('Error removing Personal Best:', error);
                alert('Failed to remove Personal Best. Please try again.');
              }
            }}
            getPersonalBestsByClient={async (clientId) => {
              try {
                const stored = localStorage.getItem(`personalBests_${clientId}`);
                return stored ? JSON.parse(stored) : [];
              } catch (error) {
                console.error('Error loading Personal Bests:', error);
                return [];
              }
            }}
            onUpdateWorkout={modifyWorkout}
            onDeleteWorkout={removeWorkout}
            onCreateWorkout={createWorkout}
            workoutTemplates={workoutTemplates}
            onCreateWorkoutTemplate={createWorkoutTemplate}
            onUpdateWorkoutTemplate={modifyWorkoutTemplate}
            onBack={() => {
              setActiveView('clients');
              setSelectedClientId(null);
            }}
          />
        )}

        {activeView === 'exercises' && (
          <ExerciseList
            exercises={exercises}
            onAdd={createExercise}
            onUpdate={modifyExercise}
            onDelete={removeExercise}
            onImportBatch={importExercisesBatch}
          />
        )}

        {activeView === 'workoutLibrary' && (
          <WorkoutLibraryView
            workoutTemplates={workoutTemplates}
            exercises={exercises}
            clients={clients}
            onDeleteTemplate={removeWorkoutTemplate}
            onUpdateTemplate={modifyWorkoutTemplate}
            onCreateWorkoutTemplate={createWorkoutTemplate}
            onCreateWorkout={createWorkout}
            onUpdateWorkout={modifyWorkout}
            onDeleteWorkout={removeWorkout}
          />
        )}

        {activeView === 'admin' && (
          <Admin
            clients={clients}
            workouts={workouts}
            exercises={exercises}
          />
        )}
      </main>
    </div>
  );
}

export default App;
