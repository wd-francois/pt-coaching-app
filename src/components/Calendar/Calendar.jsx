import { useState, useMemo } from 'react';
import { Button } from '../UI/Button';
import { ClientSelectModal } from '../Workouts/ClientSelectModal';

export const Calendar = ({ 
    workouts, 
    clients, 
    exercises, 
    onCreateWorkout, 
    onUpdateWorkout, 
    onDeleteWorkout,
    workoutTemplates = [],
    onCreateWorkoutTemplate = null,
    onUpdateWorkoutTemplate = null,
    onDeleteWorkoutTemplate = null,
    onCreatePersonalBest = null,
    onDeletePersonalBest = null,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    // Convert Sunday (0) to 6, Monday (1) to 0, etc. to make Monday the first day
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
    const daysInMonth = lastDayOfMonth.getDate();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateClick = (day) => {
        const clickedDate = new Date(year, month, day);
        setSelectedDate(formatDate(clickedDate));
        setIsClientModalOpen(true);
    };

    const workoutsByDate = useMemo(() => {
        const map = {};
        const processedGroupSessions = new Set();
        
        workouts.forEach(workout => {
            if (!map[workout.date]) {
                map[workout.date] = [];
            }
            
            // If this workout is part of a group session, group them together
            if (workout.groupSessionId && workout.isGroup) {
                const groupKey = `${workout.date}-${workout.groupSessionId}`;
                
                // Only add the group once
                if (!processedGroupSessions.has(groupKey)) {
                    processedGroupSessions.add(groupKey);
                    
                    // Find all workouts in this group session
                    const groupWorkouts = workouts.filter(w => 
                        w.groupSessionId === workout.groupSessionId && 
                        w.date === workout.date
                    );
                    
                    // Create a grouped workout entry
                    const groupWorkout = {
                        ...workout,
                        clientIds: groupWorkouts.map(w => w.clientId).filter(Boolean),
                        isGroup: true,
                        groupSessionId: workout.groupSessionId,
                        _groupWorkouts: groupWorkouts, // Store individual workouts for reference
                    };
                    
                    map[workout.date].push(groupWorkout);
                }
            } else {
                // Regular single-client workout
                map[workout.date].push(workout);
            }
        });
        
        // Sort workouts by time (early to late) for each date
        Object.keys(map).forEach(date => {
            map[date].sort((a, b) => {
                const timeA = a.time || '';
                const timeB = b.time || '';
                
                // Workouts without time go to the end
                if (!timeA && !timeB) return 0;
                if (!timeA) return 1;
                if (!timeB) return -1;
                
                // Compare times (HH:MM format)
                return timeA.localeCompare(timeB);
            });
        });
        
        return map;
    }, [workouts]);

    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="aspect-square" />);
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDate(new Date(year, month, day));
            const dayWorkouts = workoutsByDate[dateStr] || [];
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    aria-label={`Select date ${day} ${monthNames[month]} ${year}${isToday ? ', today' : ''}`}
                    aria-current={isToday ? 'date' : undefined}
                    className={`aspect-square p-2 rounded-lg transition-all hover:scale-105 ${isToday
                            ? 'glass ring-2 ring-purple-500'
                            : 'glass glass-hover'
                        }`}
                >
                    <div className="h-full flex flex-col">
                        <span className={`text-sm font-semibold ${isToday ? 'text-purple-400' : 'text-white'}`}>
                            {day}
                        </span>
                        {dayWorkouts.length > 0 && (
                            <div className="mt-1 flex-1 flex flex-col gap-1">
                                {dayWorkouts.slice(0, 2).map((workout, idx) => {
                                    let displayText = 'Unknown';
                                    let titleText = 'Unknown';
                                    
                                    if (workout.isGroup && workout.clientIds) {
                                        // Group workout
                                        const groupClients = workout.clientIds
                                            .map(id => clients.find(c => c.id === id))
                                            .filter(c => c)
                                            .map(c => c.name);
                                        displayText = 'SGT';
                                        titleText = groupClients.length > 0 
                                            ? groupClients.join(', ')
                                            : 'Small Group Training';
                                    } else if (workout.clientId) {
                                        // Single client workout
                                        const client = clients.find(c => c.id === workout.clientId);
                                        displayText = client?.name || 'Unknown';
                                        titleText = displayText;
                                    }
                                    
                                    return (
                                        <div
                                            key={idx}
                                            className={`text-xs px-1 py-0.5 rounded truncate ${
                                                workout.isGroup 
                                                    ? 'bg-teal-600/50 border border-teal-400/50' 
                                                    : 'bg-purple-600/50'
                                            }`}
                                            title={titleText}
                                        >
                                            {displayText}
                                        </div>
                                    );
                                })}
                                {dayWorkouts.length > 2 && (
                                    <div className="text-xs text-hc-textSecondary">
                                        +{dayWorkouts.length - 2} more
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </button>
            );
        }

        return days;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Calendar</h1>
                    <p className="text-hc-textSecondary mt-1">Schedule and manage workouts</p>
                </div>
                <Button onClick={goToToday} variant="secondary" aria-label="Go to today's date">
                    Today
                </Button>
            </div>

            {/* Calendar Navigation */}
            <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">
                        {monthNames[month]} {year}
                    </h2>
                    <div className="flex gap-2">
                        <Button onClick={previousMonth} variant="ghost" size="sm" aria-label="Go to previous month">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Button>
                        <Button onClick={nextMonth} variant="ghost" size="sm" aria-label="Go to next month">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </Button>
                    </div>
                </div>

                {/* Day names */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {dayNames.map(day => (
                        <div key={day} className="text-center text-sm font-semibold text-hc-textSecondary py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                    {renderCalendarDays()}
                </div>
            </div>

            {/* Client Selection Modal */}
            <ClientSelectModal
                isOpen={isClientModalOpen}
                onClose={() => {
                    setIsClientModalOpen(false);
                    setSelectedDate(null);
                }}
                selectedDate={selectedDate}
                clients={clients}
                exercises={exercises}
                workouts={workouts}
                onCreateWorkout={onCreateWorkout}
                onUpdateWorkout={onUpdateWorkout}
                onDeleteWorkout={onDeleteWorkout}
                workoutTemplates={workoutTemplates}
                onCreateWorkoutTemplate={onCreateWorkoutTemplate}
                onUpdateWorkoutTemplate={onUpdateWorkoutTemplate}
                onDeleteWorkoutTemplate={onDeleteWorkoutTemplate}
                onCreatePersonalBest={onCreatePersonalBest}
                onDeletePersonalBest={onDeletePersonalBest}
            />
        </div>
    );
};
