import { useState, useRef } from 'react';

/**
 * Enhanced time input component for 24-hour format (HH:MM)
 * Typing starts fresh on focus and fills in left-to-right (like a card
 * expiry field) so manual entry never depends on where the cursor lands.
 * Up/down arrows and the +/- buttons still step by `step` minutes.
 */
export const TimeInput24Hour = ({ value, onChange, id, className = '', step = 60, ...props }) => {
    const [digits, setDigits] = useState(''); // raw digits typed since focus, max 4 (HHMM)
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef(null);

    const committedTime = (() => {
        if (value) {
            const [h, m] = value.split(':');
            if (h && m) return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
        }
        return '00:00';
    })();

    const clampDigits = (d) => {
        let out = d;
        if (out.length >= 2) {
            const hh = Math.min(23, parseInt(out.slice(0, 2), 10));
            out = String(hh).padStart(2, '0') + out.slice(2);
        }
        if (out.length === 4) {
            const mm = Math.min(59, parseInt(out.slice(2, 4), 10));
            out = out.slice(0, 2) + String(mm).padStart(2, '0');
        }
        return out;
    };

    const formatFromDigits = (d) => {
        if (d.length <= 2) return d;
        return `${d.slice(0, 2)}:${d.slice(2)}`;
    };

    const displayValue = isEditing ? formatFromDigits(digits) : committedTime;

    const commit = (h, m) => {
        const newTime = `${String(Math.max(0, Math.min(23, h))).padStart(2, '0')}:${String(Math.max(0, Math.min(59, m))).padStart(2, '0')}`;
        if (onChange) onChange({ target: { value: newTime } });
    };

    const adjustTime = (deltaMinutes) => {
        const [h, m] = committedTime.split(':').map(Number);
        const total = (((h * 60 + m + deltaMinutes) % (24 * 60)) + 24 * 60) % (24 * 60);
        commit(Math.floor(total / 60), total % 60);
    };

    const handleChange = (e) => {
        const raw = e.target.value;
        let newDigits = raw.replace(/\D/g, '').slice(0, 4);

        // Backspacing over the auto-inserted colon removes the separator but
        // leaves the digit count unchanged - drop the trailing digit too so
        // backspace always deletes one character from the user's point of view.
        if (raw.length < displayValue.length && newDigits.length === digits.length && digits.length > 0) {
            newDigits = digits.slice(0, -1);
        }

        setDigits(clampDigits(newDigits));
        setIsEditing(true);
    };

    const handleFocus = (e) => {
        setIsEditing(true);
        setDigits('');
        e.target.select();
    };

    const commitDigits = () => {
        if (digits.length > 0) {
            const h = parseInt(digits.slice(0, 2), 10) || 0;
            const m = digits.length > 2 ? parseInt(digits.slice(2), 10) || 0 : 0;
            commit(h, m);
        }
        setIsEditing(false);
        setDigits('');
    };

    const handleBlur = () => {
        commitDigits();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            adjustTime(step);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            adjustTime(-step);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            commitDigits();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            setIsEditing(false);
            setDigits('');
        }
    };

    return (
        <div className={`flex items-center gap-1 ${className}`} id={id}>
            {/* Decrement Button */}
            <button
                type="button"
                onClick={() => adjustTime(-step)}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-purple-500/50 transition-all duration-200 group"
                aria-label="Decrease time"
                tabIndex={-1}
            >
                <svg
                    className="w-4 h-4 text-gray-200 group-hover:text-purple-400 transition-colors"
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
                    onKeyDown={handleKeyDown}
                    maxLength={5}
                    className="w-20 text-center bg-transparent border-none focus:outline-none text-white font-semibold text-lg px-1"
                    aria-label="Time in 24-hour format (HH:MM)"
                    placeholder="HH:MM"
                    {...props}
                />
            </div>

            {/* Increment Button */}
            <button
                type="button"
                onClick={() => adjustTime(step)}
                onMouseDown={(e) => e.preventDefault()}
                className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 hover:border-purple-500/50 transition-all duration-200 group"
                aria-label="Increase time"
                tabIndex={-1}
            >
                <svg
                    className="w-4 h-4 text-gray-200 group-hover:text-purple-400 transition-colors"
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
