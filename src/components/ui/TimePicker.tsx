// components/ui/TimePicker.tsx
"use client";
import { useEffect, useRef, useState } from 'react';

interface TimePickerProps {
  label: string;
  value: { hours: string; minutes: string; seconds: string };
  onChange: (time: { hours: string; minutes: string; seconds: string }) => void;
  icon?: string;
}

export function TimePicker({ label, value, onChange, icon }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesSeconds = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  const handleTimeChange = (type: 'hours' | 'minutes' | 'seconds', val: string) => {
    onChange({
      ...value,
      [type]: val,
    });
  };

  return (
    <div>
      <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
        {icon} {label}
      </label>
      
      {/* Display Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-lg transition-all duration-300 flex items-center justify-between"
      >
        <span>{value.hours}:{value.minutes}:{value.seconds}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Time Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-gradient-to-br from-[#1a0f3a] to-[#0a0118] border-2 border-[#7C3AED] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-xl text-center mb-4 uppercase">Select Time</h3>
            
            <div className="flex gap-2 justify-center items-center mb-6">
              {/* Hours */}
              <TimeWheel
                values={hours}
                selected={value.hours}
                onChange={(val) => handleTimeChange('hours', val)}
                label="HH"
              />
              
              <span className="text-white font-black text-2xl">:</span>
              
              {/* Minutes */}
              <TimeWheel
                values={minutesSeconds}
                selected={value.minutes}
                onChange={(val) => handleTimeChange('minutes', val)}
                label="MM"
              />
              
              <span className="text-white font-black text-2xl">:</span>
              
              {/* Seconds */}
              <TimeWheel
                values={minutesSeconds}
                selected={value.seconds}
                onChange={(val) => handleTimeChange('seconds', val)}
                label="SS"
              />
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white font-black py-3 rounded-xl uppercase tracking-wider active:scale-95 transition-transform"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

interface TimeWheelProps {
  values: string[];
  selected: string;
  onChange: (value: string) => void;
  label: string;
}

function TimeWheel({ values, selected, onChange, label }: TimeWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);

  useEffect(() => {
    // Scroll to selected value on mount
    const selectedIndex = values.indexOf(selected);
    if (wheelRef.current && selectedIndex !== -1) {
      const itemHeight = 40;
      const centerOffset = wheelRef.current.clientHeight / 2 - itemHeight / 2;
      wheelRef.current.scrollTop = selectedIndex * itemHeight - centerOffset;
    }
  }, [selected, values]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.pageY - (wheelRef.current?.offsetTop || 0));
    setScrollTop(wheelRef.current?.scrollTop || 0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].pageY - (wheelRef.current?.offsetTop || 0));
    setScrollTop(wheelRef.current?.scrollTop || 0);
  };

  const handleScroll = () => {
    if (!wheelRef.current) return;
    
    const itemHeight = 40;
    const centerOffset = wheelRef.current.clientHeight / 2 - itemHeight / 2;
    const scrollTop = wheelRef.current.scrollTop;
    const centerIndex = Math.round((scrollTop + centerOffset) / itemHeight);
    
    if (centerIndex >= 0 && centerIndex < values.length) {
      onChange(values[centerIndex]);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-gray-400 text-xs font-bold mb-1">{label}</span>
      <div className="relative w-20 h-40 overflow-hidden">
        {/* Center highlight */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 bg-[#7C3AED]/20 border-y-2 border-[#7C3AED] pointer-events-none z-10" />
        
        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#1a0f3a] to-transparent pointer-events-none z-20" />
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1a0f3a] to-transparent pointer-events-none z-20" />
        
        {/* Scrollable wheel */}
        <div
          ref={wheelRef}
          onScroll={handleScroll}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="h-full overflow-y-scroll scrollbar-hide scroll-smooth"
          style={{
            paddingTop: '80px',
            paddingBottom: '80px',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
        >
          {values.map((val) => (
            <div
              key={val}
              onClick={() => onChange(val)}
              className={`h-10 flex items-center justify-center text-lg font-black transition-all duration-200 ${
                val === selected
                  ? 'text-white scale-110'
                  : 'text-gray-500 scale-90'
              }`}
            >
              {val}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}