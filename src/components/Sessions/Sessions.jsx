import { useState, useMemo } from 'react';
import { Button } from '../UI/Button';

export const Sessions = ({ workouts, clients }) => {
    const [viewType, setViewType] = useState('weekly'); // 'weekly' or 'monthly'
    const [currentDate, setCurrentDate] = useState(new Date());

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

    // Get start of week (Monday)
    const getStartOfWeek = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        // Convert to Monday-based week: Monday = 0, Sunday = 6
        const mondayOffset = day === 0 ? 6 : day - 1;
        const diff = d.getDate() - mondayOffset;
        return new Date(d.getFullYear(), d.getMonth(), diff);
    };

    // Get end of week (Sunday)
    const getEndOfWeek = (date) => {
        const start = getStartOfWeek(date);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        return end;
    };

    // Get start of month
    const getStartOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    };

    // Get end of month
    const getEndOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    };

    const weeklySessions = useMemo(() => {
        const weekStart = getStartOfWeek(currentDate);
        const weekEnd = getEndOfWeek(currentDate);
        weekStart.setHours(0, 0, 0, 0);
        weekEnd.setHours(23, 59, 59, 999);

        return workouts.filter(workout => {
            const workoutDate = parseDate(workout.date);
            return workoutDate >= weekStart && workoutDate <= weekEnd;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workouts, currentDate]);

    const monthlySessions = useMemo(() => {
        const monthStart = getStartOfMonth(currentDate);
        const monthEnd = getEndOfMonth(currentDate);
        monthStart.setHours(0, 0, 0, 0);
        monthEnd.setHours(23, 59, 59, 999);

        return workouts.filter(workout => {
            const workoutDate = parseDate(workout.date);
            return workoutDate >= monthStart && workoutDate <= monthEnd;
        });
    }, [workouts, currentDate]);

    const sessionsByClient = useMemo(() => {
        const sessions = viewType === 'weekly' ? weeklySessions : monthlySessions;
        const map = {};
        
        sessions.forEach(workout => {
            const client = clients.find(c => c.id === workout.clientId);
            const clientName = client?.name || 'Unknown';
            
            if (!map[clientName]) {
                map[clientName] = {
                    name: clientName,
                    count: 0,
                    workouts: []
                };
            }
            map[clientName].count++;
            map[clientName].workouts.push(workout);
        });

        return Object.values(map).sort((a, b) => b.count - a.count);
    }, [weeklySessions, monthlySessions, viewType, clients]);

    const sessionsByDate = useMemo(() => {
        const sessions = viewType === 'weekly' ? weeklySessions : monthlySessions;
        const map = {};
        
        sessions.forEach(workout => {
            if (!map[workout.date]) {
                map[workout.date] = [];
            }
            map[workout.date].push(workout);
        });

        return Object.entries(map)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, workouts]) => ({ date, workouts }));
    }, [weeklySessions, monthlySessions, viewType]);

    const previousPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewType === 'weekly') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const nextPeriod = () => {
        const newDate = new Date(currentDate);
        if (viewType === 'weekly') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToCurrentPeriod = () => {
        setCurrentDate(new Date());
    };

    const formatPeriodLabel = () => {
        if (viewType === 'weekly') {
            const weekStart = getStartOfWeek(currentDate);
            const weekEnd = getEndOfWeek(currentDate);
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${monthNames[weekStart.getMonth()]} ${weekStart.getDate()} - ${monthNames[weekEnd.getMonth()]} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`;
        } else {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
        }
    };

    const currentSessions = viewType === 'weekly' ? weeklySessions : monthlySessions;
    const totalSessions = currentSessions.length;
    const uniqueClients = new Set(currentSessions.map(w => w.clientId)).size;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Sessions</h1>
                    <p className="text-gray-200 mt-1">View weekly & monthly session statistics</p>
                </div>
                <Button onClick={goToCurrentPeriod} variant="secondary">
                    Current {viewType === 'weekly' ? 'Week' : 'Month'}
                </Button>
            </div>

            {/* View Toggle */}
            <div className="glass rounded-2xl p-6">
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setViewType('weekly')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            viewType === 'weekly'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-gray-100 hover:bg-white/10'
                        }`}
                    >
                        Weekly
                    </button>
                    <button
                        onClick={() => setViewType('monthly')}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                            viewType === 'monthly'
                                ? 'bg-purple-600 text-white'
                                : 'bg-white/5 text-gray-100 hover:bg-white/10'
                        }`}
                    >
                        Monthly
                    </button>
                </div>

                {/* Period Navigation */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {formatPeriodLabel()}
                    </h2>
                    <div className="flex gap-2">
                        <Button onClick={previousPeriod} variant="ghost" size="sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <Button onClick={nextPeriod} variant="ghost" size="sm">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-gray-200 mb-1">Total Sessions</div>
                        <div className="text-3xl font-bold text-white">{totalSessions}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-gray-200 mb-1">Active Clients</div>
                        <div className="text-3xl font-bold text-white">{uniqueClients}</div>
                    </div>
                    <div className="glass glass-hover p-4 rounded-lg">
                        <div className="text-sm text-gray-200 mb-1">Avg. Sessions/Day</div>
                        <div className="text-3xl font-bold text-white">
                            {viewType === 'weekly' 
                                ? (totalSessions / 7).toFixed(1)
                                : (totalSessions / new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()).toFixed(1)
                            }
                        </div>
                    </div>
                </div>

                {/* Sessions by Client */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Sessions by Client</h3>
                    <div className="space-y-2">
                        {sessionsByClient.length > 0 ? (
                            sessionsByClient.map((client, idx) => (
                                <div key={idx} className="glass glass-hover p-4 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-600/30 flex items-center justify-center">
                                                <span className="text-purple-400 font-semibold">
                                                    {client.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{client.name}</div>
                                                <div className="text-sm text-gray-200">{client.count} session{client.count !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-purple-400">{client.count}</div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass glass-hover p-8 rounded-lg text-center">
                                <p className="text-gray-200">No sessions found for this {viewType === 'weekly' ? 'week' : 'month'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sessions by Date */}
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Sessions by Date</h3>
                    <div className="space-y-2">
                        {sessionsByDate.length > 0 ? (
                            sessionsByDate.map(({ date, workouts }) => {
                                const dateObj = parseDate(date);
                                const isToday = formatDate(new Date()) === date;
                                const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                
                                return (
                                    <div 
                                        key={date} 
                                        className={`glass glass-hover p-4 rounded-lg ${isToday ? 'ring-2 ring-purple-500' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-semibold text-white">
                                                    {dayNames[dateObj.getDay()]}, {monthNames[dateObj.getMonth()]} {dateObj.getDate()}
                                                    {isToday && <span className="ml-2 text-xs text-purple-400">(Today)</span>}
                                                </div>
                                                <div className="text-sm text-gray-200 mt-1">
                                                    {workouts.map((w, idx) => {
                                                        const client = clients.find(c => c.id === w.clientId);
                                                        // Format time to 24-hour format (HH:MM)
                                                        const formatTime = (timeStr) => {
                                                            if (!timeStr) return '';
                                                            if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
                                                            if (/^\d{2}:\d{2}:\d{2}$/.test(timeStr)) return timeStr.substring(0, 5);
                                                            try {
                                                                const [h, m] = timeStr.split(':');
                                                                const hours = parseInt(h, 10);
                                                                const mins = parseInt(m, 10);
                                                                if (!isNaN(hours) && !isNaN(mins)) {
                                                                    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
                                                                }
                                                            } catch {
                                                                // If parsing fails, return original
                                                            }
                                                            return timeStr;
                                                        };
                                                        return (
                                                            <span key={idx}>
                                                                {client?.name || 'Unknown'}
                                                                {w.time && ` (${formatTime(w.time)})`}
                                                                {idx < workouts.length - 1 && ', '}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-purple-400">{workouts.length}</div>
                                                <div className="text-xs text-gray-200">session{workouts.length !== 1 ? 's' : ''}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="glass glass-hover p-8 rounded-lg text-center">
                                <p className="text-gray-200">No sessions scheduled for this {viewType === 'weekly' ? 'week' : 'month'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
