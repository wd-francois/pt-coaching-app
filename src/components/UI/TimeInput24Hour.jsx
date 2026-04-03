import { useState, useEffect, useRef } from 'react';

/**
 * Enhanced time input component for 24-hour format (HH:MM)
 * Features increment/decrement buttons, better UX, and improved typing experience
 */
export const TimeInput24Hour = ({ value, onChange, id, className = '', step = 60, ...props }) => {
    const [displayValue, setDisplayValue] = useState('');
    const [cursorPosition, setCursorPosition] = useState(0);
    const inputRef = useRef(null);
    const isInitialFocus = useRef(true);

    // Sync with external value changes
    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            if (h && m) {
                setDisplayValue(`${h.padStart(2, '0')}:${m.padStart(2, '0')}`);
            } else {
                setDisplayValue('00:00');
            }
        } else {
            setDisplayValue('00:00');
        }
    }, [value]);

    const formatTime = (hours, minutes) => {
        const h = String(Math.max(0, Math.min(23, hours))).padStart(2, '0');
        const m = String(Math.max(0, Math.min(59, minutes))).padStart(2, '0');
        return `${h}:${m}`;
    };

    const updateTime = (newTime, preserveCursor = false) => {
        setDisplayValue(newTime);
        if (onChange) {
            onChange({ target: { value: newTime } });
        }
        
        // Restore cursor position after state update
        if (preserveCursor && inputRef.current) {
            setTimeout(() => {
                if (inputRef.current) {
                    const pos = Math.min(cursorPosition, newTime.length);
                    inputRef.current.setSelectionRange(pos, pos);
                }
            }, 0);
        }
    };

    const adjustTime = (deltaMinutes) => {
        const [hours, minutes] = displayValue.split(':').map(v => parseInt(v, 10) || 0);
        let totalMinutes = hours * 60 + minutes + deltaMinutes;
        
        // Handle wraparound
        if (totalMinutes < 0) {
            totalMinutes = 24 * 60 + totalMinutes;
        } else if (totalMinutes >= 24 * 60) {
            totalMinutes = totalMinutes % (24 * 60);
        }
        
        const newHours = Math.floor(totalMinutes / 60);
        const newMinutes = totalMinutes % 60;
        const newTime = formatTime(newHours, newMinutes);
        updateTime(newTime);
    };

    const handleIncrement = () => {
        adjustTime(step);
    };

    const handleDecrement = () => {
        adjustTime(-step);
    };

    const handleChange = (e) => {
        const input = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        setCursorPosition(cursorPos);
        
        // Allow empty input temporarily for better editing
        if (input === '') {
            setDisplayValue('');
            return;
        }
        
        // Remove all non-numeric characters except colon
        let cleaned = input.replace(/[^\d:]/g, '');
        
        // If user typed colon, preserve it but ensure proper format
        if (cleaned.includes(':')) {
            const parts = cleaned.split(':');
            if (parts.length === 2) {
                const h = Math.min(23, parseInt(parts[0] || '0', 10) || 0);
                const m = Math.min(59, parseInt(parts[1] || '0', 10) || 0);
                const newTime = formatTime(h, m);
                setDisplayValue(newTime);
                if (onChange) {
                    onChange({ target: { value: newTime } });
                }
                // Position cursor after the colon if user just typed it
                setTimeout(() => {
                    if (inputRef.current && cursorPos >= 2) {
                        inputRef.current.setSelectionRange(3, 3);
                    }
                }, 0);
                return;
            }
        }
        
        // Extract only digits
        const digits = cleaned.replace(/\D/g, '');
        
        if (digits.length === 0) {
            setDisplayValue('00:00');
            if (onChange) {
                onChange({ target: { value: '00:00' } });
            }
            return;
        }
        
        // Smart parsing based on cursor position and input length
        const [currentHours, currentMinutes] = displayValue.split(':').map(v => parseInt(v, 10) || 0);
        let newHours = currentHours;
        let newMinutes = currentMinutes;
        
        if (digits.length === 1) {
            // Single digit: if cursor is in hours section (0-2), update hours; otherwise minutes
            if (cursorPos <= 2) {
                newHours = parseInt(digits, 10);
                newMinutes = 0;
            } else {
                newMinutes = parseInt(digits, 10);
            }
        } else if (digits.length === 2) {
            // Two digits: could be hours or minutes depending on cursor position
            if (cursorPos <= 2) {
                // User is editing hours
                newHours = Math.min(23, parseInt(digits, 10));
                newMinutes = 0;
            } else {
                // User is editing minutes
                newMinutes = Math.min(59, parseInt(digits, 10));
            }
        } else if (digits.length === 3) {
            // Three digits: HMM format
            newHours = Math.min(23, parseInt(digits[0], 10));
            newMinutes = Math.min(59, parseInt(digits.slice(1, 3), 10));
        } else {
            // Four or more digits: HHMM format
            newHours = Math.min(23, parseInt(digits.slice(0, 2), 10));
            newMinutes = Math.min(59, parseInt(digits.slice(2, 4), 10));
        }
        
        const newTime = formatTime(newHours, newMinutes);
        setDisplayValue(newTime);
        if (onChange) {
            onChange({ target: { value: newTime } });
        }
        
        // Smart cursor positioning
        setTimeout(() => {
            if (inputRef.current) {
                let newPos = cursorPos;
                if (digits.length === 1 && cursorPos <= 2) {
                    // If typing first digit of hours, move cursor to minutes
                    newPos = 3;
                } else if (digits.length === 2 && cursorPos <= 2) {
                    // If typed two digits in hours, move to minutes
                    newPos = 3;
                } else if (digits.length >= 3) {
                    // If typed full time, position at end
                    newPos = 5;
                }
                inputRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const handleBlur = () => {
        // Ensure valid format on blur
        const [h, m] = displayValue.split(':').map(v => parseInt(v, 10) || 0);
        const finalTime = formatTime(h, m);
        setDisplayValue(finalTime);
        if (onChange) {
            onChange({ target: { value: finalTime } });
        }
        isInitialFocus.current = true;
    };

    const handleKeyDown = (e) => {
        const input = inputRef.current;
        if (!input) return;
        
        const cursorPos = input.selectionStart || 0;
        
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            adjustTime(step);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            adjustTime(-step);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            // Allow normal arrow key navigation
            return;
        } else if (e.key === 'Backspace') {
            // Smart backspace: if at colon position, move left
            if (cursorPos === 3) {
                e.preventDefault();
                input.setSelectionRange(2, 2);
            }
        } else if (e.key === 'Delete') {
            // Smart delete: if at colon position, move right
            if (cursorPos === 2) {
                e.preventDefault();
                input.setSelectionRange(3, 3);
            }
        } else if (e.key === 'Tab') {
            // Allow normal tab behavior
            return;
        }
    };

    const handleFocus = (e) => {
        // Only auto-select if it's the initial focus and value is default
        if (isInitialFocus.current && displayValue === '00:00') {
            e.target.select();
            isInitialFocus.current = false;
        } else {
            // Otherwise, just position cursor at the start or preserve position
            const pos = e.target.selectionStart || 0;
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.setSelectionRange(pos, pos);
                }
            }, 0);
        }
    };

    const handleClick = (e) => {
        // Allow normal cursor positioning on click
        isInitialFocus.current = false;
    };

    return (
        <div className={`flex items-center gap-1 ${className}`} id={id}>
            {/* Decrement Button */}
            <button
                type="button"
                onClick={handleDecrement}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-purple-500/50 transition-all duration-200 group"
                aria-label="Decrease time"
                tabIndex={-1}
            >
                <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Time Input */}
            <div className="relative flex items-center bg-white/5 border border-white/10 rounded-lg px-3 py-2 hover:border-purple-500/50 focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-500/20 transition-all duration-200">
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    onClick={handleClick}
                    onKeyDown={handleKeyDown}
                    maxLength={5}
                    className="w-20 text-center bg-transparent border-none focus:outline-none text-white font-semibold text-lg px-1"
                    aria-label="Time in 24-hour format (HH:MM)"
                    placeholder="00:00"
                    {...props}
                />
            </div>

            {/* Increment Button */}
            <button
                type="button"
                onClick={handleIncrement}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-purple-500/50 transition-all duration-200 group"
                aria-label="Increase time"
                tabIndex={-1}
            >
                <svg 
                    className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition-colors" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
            </button>
        </div>
    );
};
