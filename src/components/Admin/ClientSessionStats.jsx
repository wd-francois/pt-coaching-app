import { useState, useMemo, useRef, useEffect } from 'react';
import { Button } from '../UI/Button';
import * as db from '../../utils/db';
import { checkForBackups, restoreFromBackups, exportBackupsToFile } from '../../utils/dataRecovery';

export const ClientSessionStats = ({ clients, workouts, exercises = [] }) => {
    const [timeframe, setTimeframe] = useState('all'); // 'day', 'week', 'month', 'year', 'all'
    const [currentPeriodDate, setCurrentPeriodDate] = useState(new Date());
    const [selectedClient, setSelectedClient] = useState(null);
    const [expandedWorkouts, setExpandedWorkouts] = useState(new Set()); // Track which workouts are expanded
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [recovering, setRecovering] = useState(false);
    const [backupStatus, setBackupStatus] = useState(null);
    const fileInputRef = useRef(null);

    // Check for backups on mount
    useEffect(() => {
        const status = checkForBackups();
        setBackupStatus(status);
    }, []);

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const parseDate = (dateStr) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Group sessions are stored once per client; this key makes them count as one session.
    const getSessionKey = (workout) => {
        if (workout?.isGroup && workout?.groupSessionId) {
            return `group-${workout.date}-${workout.groupSessionId}`;
        }
        return `single-${workout?.id ?? `${workout?.date}-${workout?.clientId ?? 'unknown'}`}`;
    };

    const getUniqueSessionCount = (workoutList = []) => new Set(workoutList.map(getSessionKey)).size;

    const getUniqueSessionCountByType = (workoutList = [], type = 'oneOnOne') => {
        const filtered = workoutList.filter((workout) => {
            const isGroupSession = Boolean(workout?.isGroup && workout?.groupSessionId);
            return type === 'sgt' ? isGroupSession : !isGroupSession;
        });
        return getUniqueSessionCount(filtered);
    };

    const getYearWeekNumber = (dateInput) => {
        const date = new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const startOfYearDay = startOfYear.getDay(); // Sunday=0
        const mondayOffset = startOfYearDay === 0 ? 6 : startOfYearDay - 1;
        const firstWeekMonday = new Date(startOfYear);
        firstWeekMonday.setDate(startOfYear.getDate() - mondayOffset);

        const msPerDay = 24 * 60 * 60 * 1000;
        const dayDiff = Math.floor((date - firstWeekMonday) / msPerDay);
        return Math.floor(dayDiff / 7) + 1;
    };

    // Get start of week (Monday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const mondayOffset = day === 0 ? 6 : day - 1;
        const diff = d.getDate() - mondayOffset;
        return new Date(d.getFullYear(), d.getMonth(), diff);
    };

    // Format time to 24-hour format (HH:MM)
    const formatTime24Hour = (timeStr) => {
        if (!timeStr) return '';
        // If already in HH:MM format, return as is
        if (/^\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr;
        }
        // If in HH:MM:SS format, remove seconds
        if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) {
            return timeStr.substring(0, 5);
        }
        // Try to parse and convert to 24-hour format
        try {
            const [hours, minutes] = timeStr.split(':');
            const h = parseInt(hours, 10);
            const m = parseInt(minutes, 10);
            if (!isNaN(h) && !isNaN(m)) {
                return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
            }
        } catch {
            // If parsing fails, return original
        }
        return timeStr;
    };

    // Get date range based on timeframe
    const getDateRange = () => {
        const baseDate = new Date(currentPeriodDate);
        let start, end;

        switch (timeframe) {
            case 'day':
                start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                end = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
                break;
            case 'week':
                start = getStartOfWeek(baseDate);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
                end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
                break;
            case 'year':
                start = new Date(baseDate.getFullYear(), 0, 1);
                end = new Date(baseDate.getFullYear(), 11, 31);
                break;
            default: // 'all'
                return null; // No date filter
        }

        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    // Filter workouts by timeframe
    const filteredWorkouts = useMemo(() => {
        const range = getDateRange();
        if (!range) return workouts;

        return workouts.filter(workout => {
            const workoutDate = parseDate(workout.date);
            return workoutDate >= range.start && workoutDate <= range.end;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workouts, timeframe, currentPeriodDate]);

    // Calculate statistics per client
    const clientStats = useMemo(() => {
        const stats = {};

        clients.forEach(client => {
            const clientWorkouts = filteredWorkouts.filter(w => w.clientId === client.id);
            
            // Group by week/month for breakdown
            const weeklyBreakdown = {};
            const monthlyBreakdown = {};

            clientWorkouts.forEach(workout => {
                const workoutDate = parseDate(workout.date);
                
                // Weekly breakdown
                const weekStart = new Date(workoutDate);
                weekStart.setDate(workoutDate.getDate() - workoutDate.getDay() + 1); // Monday
                const weekKey = formatDate(weekStart);
                weeklyBreakdown[weekKey] = (weeklyBreakdown[weekKey] || 0) + 1;

                // Monthly breakdown
                const monthKey = `${workoutDate.getFullYear()}-${String(workoutDate.getMonth() + 1).padStart(2, '0')}`;
                monthlyBreakdown[monthKey] = (monthlyBreakdown[monthKey] || 0) + 1;
            });

            stats[client.id] = {
                client,
                totalSessions: clientWorkouts.length,
                weeklyBreakdown: Object.entries(weeklyBreakdown)
                    .map(([week, count]) => ({ week, count }))
                    .sort((a, b) => a.week.localeCompare(b.week)),
                monthlyBreakdown: Object.entries(monthlyBreakdown)
                    .map(([month, count]) => ({ month, count }))
                    .sort((a, b) => a.month.localeCompare(b.month)),
                workouts: clientWorkouts,
            };
        });

        return Object.values(stats).sort((a, b) => b.totalSessions - a.totalSessions);
    }, [clients, filteredWorkouts]);

    // Overall statistics
    const overallStats = useMemo(() => {
        const totalSessions = getUniqueSessionCount(filteredWorkouts);
        const activeClients = new Set(filteredWorkouts.map(w => w.clientId)).size;
        const oneOnOneSessions = getUniqueSessionCountByType(filteredWorkouts, 'oneOnOne');
        const sgtSessions = getUniqueSessionCountByType(filteredWorkouts, 'sgt');
        const avgSessionsPerClient = activeClients > 0 ? (totalSessions / activeClients).toFixed(1) : 0;

        return {
            totalSessions,
            activeClients,
            oneOnOneSessions,
            sgtSessions,
            avgSessionsPerClient,
        };
    }, [filteredWorkouts]);

    const formatWeekLabel = (weekStr) => {
        const date = parseDate(weekStr);
        const weekEnd = new Date(date);
        weekEnd.setDate(date.getDate() + 6);
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${monthNames[date.getMonth()]} ${date.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}`;
    };

    const formatMonthLabel = (monthStr) => {
        const [year, month] = monthStr.split('-');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    };

    // Sessions done in current day/week/month/year (from all workouts)
    const periodSessionStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const weekStart = getStartOfWeek(now);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        monthStart.setHours(0, 0, 0, 0);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        const yearStart = new Date(now.getFullYear(), 0, 1);
        yearStart.setHours(0, 0, 0, 0);
        const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

        const isInRange = (dateStr, start, end) => {
            const workoutDate = parseDate(dateStr);
            return workoutDate >= start && workoutDate <= end;
        };

        const day = getUniqueSessionCount(workouts.filter(w => isInRange(w.date, todayStart, todayEnd)));
        const week = getUniqueSessionCount(workouts.filter(w => isInRange(w.date, weekStart, weekEnd)));
        const month = getUniqueSessionCount(workouts.filter(w => isInRange(w.date, monthStart, monthEnd)));
        const year = getUniqueSessionCount(workouts.filter(w => isInRange(w.date, yearStart, yearEnd)));

        return { day, week, month, year };
    }, [workouts]);

    const yearlyGraphData = useMemo(() => {
        const selectedYear = new Date(currentPeriodDate).getFullYear();

        const weeklySets = new Map();
        const monthlySets = new Map();
        const yearlySets = new Map();

        workouts.forEach((workout) => {
            const workoutDate = parseDate(workout.date);
            const sessionKey = getSessionKey(workout);
            const workoutYear = workoutDate.getFullYear();

            // Yearly totals across all years
            if (!yearlySets.has(workoutYear)) yearlySets.set(workoutYear, new Set());
            yearlySets.get(workoutYear).add(sessionKey);

            if (workoutYear === selectedYear) {
                const weekNumber = getYearWeekNumber(workoutDate);
                if (!weeklySets.has(weekNumber)) weeklySets.set(weekNumber, new Set());
                weeklySets.get(weekNumber).add(sessionKey);

                const monthNumber = workoutDate.getMonth() + 1;
                if (!monthlySets.has(monthNumber)) monthlySets.set(monthNumber, new Set());
                monthlySets.get(monthNumber).add(sessionKey);
            }
        });

        const weeklyData = Array.from(weeklySets.entries())
            .map(([week, sessionSet]) => ({ label: `W${week}`, value: sessionSet.size }))
            .sort((a, b) => parseInt(a.label.slice(1), 10) - parseInt(b.label.slice(1), 10));

        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthNamesShort.map((monthName, index) => ({
            label: monthName,
            value: monthlySets.get(index + 1)?.size || 0,
        }));

        const yearlyData = Array.from(yearlySets.entries())
            .map(([year, sessionSet]) => ({ label: String(year), value: sessionSet.size }))
            .sort((a, b) => parseInt(a.label, 10) - parseInt(b.label, 10));

        return {
            selectedYear,
            weeklyData,
            monthlyData,
            yearlyData,
            weeklyMax: Math.max(1, ...weeklyData.map(item => item.value)),
            monthlyMax: Math.max(1, ...monthlyData.map(item => item.value)),
            yearlyMax: Math.max(1, ...yearlyData.map(item => item.value)),
        };
    }, [workouts, currentPeriodDate]);

    const getTimeframeLabel = () => {
        switch (timeframe) {
            case 'day': return 'Today';
            case 'week': return 'This Week';
            case 'month': return 'This Month';
            case 'year': return 'This Year';
            default: return 'All Time';
        }
    };

    const formatPeriodLabel = () => {
        if (timeframe === 'all') return 'All Time';

        const date = new Date(currentPeriodDate);
        const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthNamesLong = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        if (timeframe === 'day') {
            return `${monthNamesShort[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
        }

        if (timeframe === 'week') {
            const weekStart = getStartOfWeek(date);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return `${monthNamesShort[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNamesShort[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        }

        if (timeframe === 'month') {
            return `${monthNamesLong[date.getMonth()]} ${date.getFullYear()}`;
        }

        return `${date.getFullYear()}`;
    };

    const goToPreviousPeriod = () => {
        if (timeframe === 'all') return;
        const nextDate = new Date(currentPeriodDate);

        if (timeframe === 'day') {
            nextDate.setDate(nextDate.getDate() - 1);
        } else if (timeframe === 'week') {
            nextDate.setDate(nextDate.getDate() - 7);
        } else if (timeframe === 'month') {
            nextDate.setMonth(nextDate.getMonth() - 1);
        } else if (timeframe === 'year') {
            nextDate.setFullYear(nextDate.getFullYear() - 1);
        }

        setCurrentPeriodDate(nextDate);
        setSelectedClient(null);
    };

    const goToNextPeriod = () => {
        if (timeframe === 'all') return;
        const nextDate = new Date(currentPeriodDate);

        if (timeframe === 'day') {
            nextDate.setDate(nextDate.getDate() + 1);
        } else if (timeframe === 'week') {
            nextDate.setDate(nextDate.getDate() + 7);
        } else if (timeframe === 'month') {
            nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (timeframe === 'year') {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        setCurrentPeriodDate(nextDate);
        setSelectedClient(null);
    };

    const goToCurrentPeriod = () => {
        setCurrentPeriodDate(new Date());
        setSelectedClient(null);
    };

    const handleExportData = async () => {
        try {
            setExporting(true);
            const exportData = await db.exportAllData();
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pt-coaching-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Data exported successfully!');
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const handleImportData = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            const text = await file.text();
            const importData = JSON.parse(text);
            
            const overwrite = window.confirm(
                'Do you want to overwrite existing data with the same IDs? ' +
                'Click OK to overwrite, or Cancel to skip existing items.'
            );

            const results = await db.importAllData(importData, { overwrite });
            
            const summary = [
                `Clients: ${results.clients.imported} imported, ${results.clients.errors} errors`,
                `Exercises: ${results.exercises.imported} imported, ${results.exercises.errors} errors`,
                `Workouts: ${results.workouts.imported} imported, ${results.workouts.errors} errors`,
                `Measurements: ${results.measurements.imported} imported, ${results.measurements.errors} errors`,
            ].join('\n');

            alert(`Import completed!\n\n${summary}\n\nPlease refresh the page to see the imported data.`);
            
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Error importing data:', error);
            alert('Failed to import data. Please check the file format and try again.');
        } finally {
            setImporting(false);
        }
    };

    const handleRecoverData = async () => {
        if (!backupStatus?.hasBackups) {
            alert('No backups found in localStorage. If you exported data previously, use the Import Data button instead.');
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

            alert(`Recovery completed!\n\n${summary}\n\nPlease refresh the page to see the recovered data.`);
            
            // Update backup status
            const newStatus = checkForBackups();
            setBackupStatus(newStatus);
        } catch (error) {
            console.error('Error recovering data:', error);
            alert('Failed to recover data. Please check the console for details.');
        } finally {
            setRecovering(false);
        }
    };

    const handleExportBackups = () => {
        try {
            exportBackupsToFile();
            alert('Backups exported successfully!');
        } catch (error) {
            console.error('Error exporting backups:', error);
            alert('Failed to export backups.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Analytics</h1>
                    <p className="text-hc-textSecondary mt-1">Session analytics and data management</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        onClick={handleExportData}
                        variant="secondary"
                        disabled={exporting}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        }
                    >
                        {exporting ? 'Exporting...' : 'Export All Data'}
                    </Button>
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="secondary"
                        disabled={importing}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        }
                    >
                        {importing ? 'Importing...' : 'Import Data'}
                    </Button>
                    {backupStatus?.hasBackups && (
                        <Button
                            onClick={handleRecoverData}
                            variant="primary"
                            disabled={recovering}
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            }
                        >
                            {recovering ? 'Recovering...' : 'Recover Data'}
                        </Button>
                    )}
                    {backupStatus?.hasBackups && (
                        <Button
                            onClick={handleExportBackups}
                            variant="secondary"
                            icon={
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                            }
                        >
                            Export Backups
                        </Button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>


            {/* Data Recovery Alert */}
            {backupStatus?.hasBackups && (
                <div className="glass rounded-2xl p-6 border-2 border-yellow-500/50 bg-yellow-900/10">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Data Recovery Available</h3>
                            <p className="text-sm text-gray-100 mb-3">
                                Backups found in localStorage:
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-200">Clients:</span>
                                    <span className="text-white font-semibold ml-2">{backupStatus.summary.clients}</span>
                                </div>
                                <div>
                                    <span className="text-gray-200">Exercises:</span>
                                    <span className="text-white font-semibold ml-2">{backupStatus.summary.exercises}</span>
                                </div>
                                <div>
                                    <span className="text-gray-200">Workouts:</span>
                                    <span className="text-white font-semibold ml-2">{backupStatus.summary.workouts}</span>
                                </div>
                                <div>
                                    <span className="text-gray-200">Measurements:</span>
                                    <span className="text-white font-semibold ml-2">{backupStatus.summary.measurements}</span>
                                </div>
                            </div>
                        </div>
                        <Button
                            onClick={handleRecoverData}
                            variant="primary"
                            disabled={recovering}
                            className="ml-4"
                        >
                            {recovering ? 'Recovering...' : 'Recover Now'}
                        </Button>
                    </div>
                </div>
            )}

            {/* No Data Message */}
            {clients.length === 0 && workouts.length === 0 && (
                <div className="glass rounded-2xl p-6 border-2 border-blue-500/50 bg-blue-900/10">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-blue-400 mb-2">No Data Found</h3>
                        <p className="text-gray-100 mb-4 max-w-2xl mx-auto">
                            Your data is stored locally in each browser. If you have data in another browser, you need to:
                        </p>
                        <div className="space-y-3 max-w-md mx-auto text-left">
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">1</span>
                                <div>
                                    <p className="text-white font-medium">Export from the original browser</p>
                                    <p className="text-sm text-gray-200">Click "Export All Data" in that browser to download a backup file</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">2</span>
                                <div>
                                    <p className="text-white font-medium">Import in this browser</p>
                                    <p className="text-sm text-gray-200">Click "Import Data" below and select the exported file</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeframe Selector */}
            <div className="glass rounded-2xl p-6">
                {/* Sessions Done: Day / Week / Month / Year */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Sessions Today</div>
                        <div className="text-3xl font-bold text-hc-text">{periodSessionStats.day}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Sessions This Week</div>
                        <div className="text-3xl font-bold text-hc-text">{periodSessionStats.week}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Sessions This Month</div>
                        <div className="text-3xl font-bold text-hc-text">{periodSessionStats.month}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Sessions This Year</div>
                        <div className="text-3xl font-bold text-hc-text">{periodSessionStats.year}</div>
                    </div>
                </div>

                <div className="flex gap-2 mb-6">
                    {['day', 'week', 'month', 'year', 'all'].map((tf) => (
                        <button
                            key={tf}
                            onClick={() => {
                                setTimeframe(tf);
                                if (tf !== 'all') {
                                    setCurrentPeriodDate(new Date());
                                }
                                setSelectedClient(null);
                            }}
                            aria-label={`View statistics for ${tf === 'all' ? 'all time' : tf}`}
                            className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                                timeframe === tf
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-white/5 text-gray-100 hover:bg-white/10'
                            }`}
                        >
                            {tf === 'all'
                                ? 'All Time'
                                : tf === 'day'
                                    ? 'Today'
                                    : tf === 'week'
                                        ? 'This Week'
                                        : tf === 'month'
                                            ? 'This Month'
                                            : 'This Year'}
                        </button>
                    ))}
                </div>

                {timeframe !== 'all' && (
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-white">{formatPeriodLabel()}</h3>
                        <div className="flex items-center gap-2">
                            <Button onClick={goToCurrentPeriod} variant="secondary" size="sm">
                                Current
                            </Button>
                            <Button onClick={goToPreviousPeriod} variant="ghost" size="sm" aria-label={`Previous ${timeframe}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Button>
                            <Button onClick={goToNextPeriod} variant="ghost" size="sm" aria-label={`Next ${timeframe}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Button>
                        </div>
                    </div>
                )}

                {/* Overall Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Total Sessions</div>
                        <div className="text-3xl font-bold text-hc-text">{overallStats.totalSessions}</div>
                        <div className="text-xs text-hc-textSecondary mt-1">{getTimeframeLabel()}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Active Clients</div>
                        <div className="text-3xl font-bold text-hc-text">{overallStats.activeClients}</div>
                        <div className="text-xs text-hc-textSecondary mt-1">With sessions in period</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">Avg. Sessions/Client</div>
                        <div className="text-3xl font-bold text-hc-text">{overallStats.avgSessionsPerClient}</div>
                        <div className="text-xs text-hc-textSecondary mt-1">Average per active client</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">1-on-1 Sessions</div>
                        <div className="text-3xl font-bold text-hc-text">{overallStats.oneOnOneSessions}</div>
                        <div className="text-xs text-hc-textSecondary mt-1">{getTimeframeLabel()}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-hc-textSecondary mb-1">SGT Sessions</div>
                        <div className="text-3xl font-bold text-hc-text">{overallStats.sgtSessions}</div>
                        <div className="text-xs text-hc-textSecondary mt-1">{getTimeframeLabel()}</div>
                    </div>
                </div>

                {/* Yearly Session Graph */}
                <div className="glass glass-hover p-4 rounded-lg mb-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white">Yearly Session Graph</h3>
                        <p className="text-sm text-hc-textSecondary">
                            Week and month breakdown for {yearlyGraphData.selectedYear}, plus yearly totals.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Sessions per Week ({yearlyGraphData.selectedYear})</h4>
                        {yearlyGraphData.weeklyData.length === 0 ? (
                            <p className="text-sm text-hc-textSecondary">No sessions found for this year.</p>
                        ) : (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {yearlyGraphData.weeklyData.map((item) => (
                                    <div key={item.label} className="grid grid-cols-[50px_1fr_40px] gap-2 items-center">
                                        <span className="text-xs text-hc-textSecondary">{item.label}</span>
                                        <div className="w-full bg-white/10 rounded h-2">
                                            <div
                                                className="bg-purple-500 h-2 rounded"
                                                style={{ width: `${(item.value / yearlyGraphData.weeklyMax) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-white text-right">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Sessions per Month ({yearlyGraphData.selectedYear})</h4>
                        <div className="space-y-2">
                            {yearlyGraphData.monthlyData.map((item) => (
                                <div key={item.label} className="grid grid-cols-[50px_1fr_40px] gap-2 items-center">
                                    <span className="text-xs text-hc-textSecondary">{item.label}</span>
                                    <div className="w-full bg-white/10 rounded h-2">
                                        <div
                                            className="bg-teal-500 h-2 rounded"
                                            style={{ width: `${(item.value / yearlyGraphData.monthlyMax) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs text-white text-right">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Sessions per Year</h4>
                        {yearlyGraphData.yearlyData.length === 0 ? (
                            <p className="text-sm text-hc-textSecondary">No yearly session data available.</p>
                        ) : (
                            <div className="space-y-2">
                                {yearlyGraphData.yearlyData.map((item) => (
                                    <div key={item.label} className="grid grid-cols-[50px_1fr_40px] gap-2 items-center">
                                        <span className="text-xs text-hc-textSecondary">{item.label}</span>
                                        <div className="w-full bg-white/10 rounded h-2">
                                            <div
                                                className="bg-indigo-500 h-2 rounded"
                                                style={{ width: `${(item.value / yearlyGraphData.yearlyMax) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-white text-right">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Client Statistics */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Sessions by Client</h3>
                    {clientStats.length === 0 ? (
                        <div className="glass glass-hover p-8 rounded-lg text-center">
                            <p className="text-hc-textSecondary">No sessions found for the selected period</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {clientStats.map((stat) => (
                                <div key={stat.client.id} className="glass glass-hover rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setSelectedClient(selectedClient === stat.client.id ? null : stat.client.id)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                        aria-label={`${stat.client.name}: ${stat.totalSessions} sessions. Click to ${selectedClient === stat.client.id ? 'hide' : 'show'} details`}
                                        aria-expanded={selectedClient === stat.client.id}
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center">
                                                <span className="text-purple-400 font-semibold text-lg">
                                                    {stat.client.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-left flex-1">
                                                <div className="font-semibold text-white">{stat.client.name}</div>
                                                <div className="text-sm text-hc-textSecondary">
                                                    {stat.totalSessions} session{stat.totalSessions !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-purple-400">{stat.totalSessions}</div>
                                                <div className="text-xs text-hc-textSecondary">total</div>
                                            </div>
                                            <svg
                                                className={`w-5 h-5 text-gray-200 transition-transform ${selectedClient === stat.client.id ? 'rotate-180' : ''}`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Expanded Details */}
                                    {selectedClient === stat.client.id && (
                                        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                                            {/* Weekly Breakdown */}
                                            {stat.weeklyBreakdown.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Weekly Breakdown</h4>
                                                    <div className="space-y-2">
                                                        {stat.weeklyBreakdown.map(({ week, count }) => (
                                                            <div key={week} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                                <span className="text-sm text-hc-textSecondary">{formatWeekLabel(week)}</span>
                                                                <span className="text-sm font-semibold text-white">{count} session{count !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Monthly Breakdown */}
                                            {stat.monthlyBreakdown.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Monthly Breakdown</h4>
                                                    <div className="space-y-2">
                                                        {stat.monthlyBreakdown.map(({ month, count }) => (
                                                            <div key={month} className="flex items-center justify-between p-2 bg-white/5 rounded">
                                                                <span className="text-sm text-hc-textSecondary">{formatMonthLabel(month)}</span>
                                                                <span className="text-sm font-semibold text-white">{count} session{count !== 1 ? 's' : ''}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Recent Sessions */}
                                            {stat.workouts.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Recent Sessions</h4>
                                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                                        {stat.workouts
                                                            .sort((a, b) => b.date.localeCompare(a.date))
                                                            .slice(0, 10)
                                                            .map((workout) => {
                                                                const workoutDate = parseDate(workout.date);
                                                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                                                const isExpanded = expandedWorkouts.has(workout.id);
                                                                
                                                                // Get exercise names
                                                                const getExerciseName = (exerciseId) => {
                                                                    const exercise = exercises.find(e => e.id === exerciseId);
                                                                    return exercise?.name || 'Unknown Exercise';
                                                                };

                                                                const toggleWorkout = () => {
                                                                    setExpandedWorkouts(prev => {
                                                                        const newSet = new Set(prev);
                                                                        if (newSet.has(workout.id)) {
                                                                            newSet.delete(workout.id);
                                                                        } else {
                                                                            newSet.add(workout.id);
                                                                        }
                                                                        return newSet;
                                                                    });
                                                                };

                                                                return (
                                                                    <div key={workout.id} className="bg-white/5 rounded-lg overflow-hidden">
                                                                        {/* Workout Header - Clickable */}
                                                                        <button
                                                                            onClick={toggleWorkout}
                                                                            className="w-full flex items-center justify-between p-3 text-left hover:bg-white/10 transition-colors"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="text-xs text-hc-textSecondary mb-1">
                                                                                    {monthNames[workoutDate.getMonth()]} {workoutDate.getDate()}, {workoutDate.getFullYear()}
                                                                                    {workout.time && ` at ${formatTime24Hour(workout.time)}`}
                                                                                </div>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {workout.exercises?.slice(0, 3).map((ex, idx) => (
                                                                                        <span key={idx} className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                                                                                            {getExerciseName(ex.exerciseId)}
                                                                                        </span>
                                                                                    ))}
                                                                                    {workout.exercises?.length > 3 && (
                                                                                        <span className="text-xs text-gray-200">
                                                                                            +{workout.exercises.length - 3} more
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <svg
                                                                                className={`w-4 h-4 text-gray-200 transition-transform flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                            >
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </button>

                                                                        {/* Expanded Exercise Details */}
                                                                        {isExpanded && workout.exercises && workout.exercises.length > 0 && (
                                                                            <div className="px-3 pb-3 space-y-3 border-t border-white/10 pt-3">
                                                                                {workout.exercises.map((exercise, exIdx) => {
                                                                                    const exerciseName = getExerciseName(exercise.exerciseId);
                                                                                    const sets = exercise.sets || [];
                                                                                    
                                                                                    return (
                                                                                        <div key={exIdx} className="bg-white/5 rounded p-3">
                                                                                            <h5 className="font-semibold text-white text-sm mb-2">{exerciseName}</h5>
                                                                                            
                                                                                            {/* Sets Table */}
                                                                                            {sets.length > 0 ? (
                                                                                                <div className="space-y-1">
                                                                                                    <div className="grid grid-cols-12 gap-2 text-xs text-gray-200 pb-1 border-b border-white/10">
                                                                                                        <div className="col-span-1">Set</div>
                                                                                                        <div className="col-span-3">Reps</div>
                                                                                                        <div className="col-span-4">Load</div>
                                                                                                        <div className="col-span-4">Notes</div>
                                                                                                    </div>
                                                                                                    {sets.map((set, setIdx) => (
                                                                                                        <div key={setIdx} className="grid grid-cols-12 gap-2 text-xs text-white">
                                                                                                            <div className="col-span-1 text-gray-200">{setIdx + 1}</div>
                                                                                                            <div className="col-span-3">{set.reps || '-'}</div>
                                                                                                            <div className="col-span-4">{set.load || '-'}</div>
                                                                                                            <div className="col-span-4 text-gray-100">{set.notes || '-'}</div>
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            ) : (
                                                                                                <p className="text-xs text-gray-200">No sets recorded</p>
                                                                                            )}
                                                                                            
                                                                                            {/* Exercise Notes */}
                                                                                            {exercise.notes && (
                                                                                                <div className="mt-2 pt-2 border-t border-white/10">
                                                                                                    <p className="text-xs text-gray-100">
                                                                                                        <span className="text-gray-200">Notes: </span>
                                                                                                        {exercise.notes}
                                                                                                    </p>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
