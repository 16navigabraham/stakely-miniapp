// components/ui/TimePicker.tsx
"use client";
import { useState } from 'react';

interface TimePickerProps {
  label: string;
  value: { hours: string; minutes: string; seconds: string };
  onChange: (time: { hours: string; minutes: string; seconds: string }) => void;
  icon?: string;
}

export function TimePicker({ label, value, onChange, icon }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (type: 'hours' | 'minutes' | 'seconds', val: string) => {
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
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-lg transition-all duration-300 flex items-center justify-between"
      >
        <span>{value.hours}:{value.minutes}:{value.seconds}</span>
        <svg className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Simple Time Picker Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div className="bg-gradient-to-br from-[#1a0f3a] to-[#0a0118] border-2 border-[#7C3AED] rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-white font-black text-xl text-center mb-6 uppercase">Select Time</h3>
            
            <div className="space-y-4 mb-6">
              {/* Hours */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Hours</label>
                <select
                  value={value.hours}
                  onChange={(e) => handleChange('hours', e.target.value)}
                  className="w-full bg-black/60 border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-lg outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map((hour) => (
                    <option key={hour} value={hour}>{hour}</option>
                  ))}
                </select>
              </div>

              {/* Minutes */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Minutes</label>
                <select
                  value={value.minutes}
                  onChange={(e) => handleChange('minutes', e.target.value)}
                  className="w-full bg-black/60 border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-lg outline-none cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((minute) => (
                    <option key={minute} value={minute}>{minute}</option>
                  ))}
                </select>
              </div>

              {/* Seconds */}
              <div>
                <label className="block text-gray-400 text-xs font-bold mb-2 uppercase">Seconds</label>
                <select
                  value={value.seconds}
                  onChange={(e) => handleChange('seconds', e.target.value)}
                  className="w-full bg-black/60 border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-lg outline-none cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map((second) => (
                    <option key={second} value={second}>{second}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="w-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white font-black py-4 rounded-xl uppercase tracking-wider active:scale-95 transition-transform"
            >
              ✓ Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}