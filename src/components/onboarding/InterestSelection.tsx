// components/onboarding/InterestSelection.tsx
"use client";
import { useState } from 'react';

interface Interest {
  id: string;
  label: string;
  icon: string;
}

const INTERESTS: Interest[] = [
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'food', label: 'Food & Drink', icon: '🍕' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'art', label: 'Art & Design', icon: '🎨' },
];

interface InterestSelectionProps {
  onComplete: (selectedInterests: string[]) => void;
}

export default function InterestSelection({ onComplete }: InterestSelectionProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleInterest = (id: string) => {
    if (isSubmitting) return;
    
    // Trigger animation
    setAnimatingId(id);
    setTimeout(() => setAnimatingId(null), 600);

    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const handleContinue = () => {
    if (selected.size >= 3 && !isSubmitting) {
      setIsSubmitting(true);
      // Pass selected interests to parent
      setTimeout(() => {
        onComplete(Array.from(selected));
      }, 300);
    }
  };

  return (
    <div className={`fixed inset-0 bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-y-auto transition-opacity duration-500 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="particle particle-1"></div>
        <div className="particle particle-2"></div>
        <div className="particle particle-3"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col px-4 py-6 pb-8 safe-area-padding">
        {/* Header - Compact for Mobile */}
        <div className="text-center mb-6 animate-slideUp">
          {/* Pulsing Badge */}
          <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-[#7C3AED]/50 rounded-full px-4 py-1.5 mb-4 shadow-lg shadow-purple-500/30">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#7C3AED] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#7C3AED]"></span>
            </span>
            <span className="text-[#7C3AED] text-xs font-bold uppercase tracking-wider">Welcome Challenger</span>
          </div>

          <h1 
            className="text-4xl font-black mb-3 uppercase tracking-tight leading-none"
            style={{ 
              fontFamily: '"Bebas Neue", "Impact", sans-serif',
              textShadow: '0 0 40px rgba(124,58,237,0.8)'
            }}
          >
            <span className="text-white drop-shadow-[0_0_40px_rgba(124,58,237,0.5)]">
              Choose Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Arena
            </span>
          </h1>
          
          <p className="text-base text-gray-300 font-bold mb-1">
            Select <span className="text-[#7C3AED] font-black">3+ interests</span>
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className={`
              px-3 py-1 rounded-full text-sm font-black transition-all duration-300
              ${selected.size >= 3 
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white scale-105' 
                : 'bg-gray-800 text-gray-400'
              }
            `}>
              {selected.size}/3+
            </div>
            {selected.size >= 3 && (
              <span className="text-green-400 text-lg animate-bounce-in">✓</span>
            )}
          </div>
        </div>

        {/* Interest Grid - Mobile Optimized */}
        <div className="flex-1 mb-6">
          <div className="grid grid-cols-2 gap-3 animate-slideUp animation-delay-200">
            {INTERESTS.map((interest) => {
              const isSelected = selected.has(interest.id);
              const isAnimating = animatingId === interest.id;
              
              return (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  disabled={isSubmitting}
                  className={`
                    group relative overflow-hidden rounded-xl p-4 transition-all duration-300
                    ${isSelected 
                      ? 'bg-gradient-to-br from-[#7C3AED] to-[#a855f7] scale-[1.02] shadow-lg shadow-purple-500/50' 
                      : 'bg-black/40 backdrop-blur-md border-2 border-gray-700 hover:border-[#7C3AED]/50'
                    }
                    ${isAnimating ? 'animate-select-bounce' : ''}
                    ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                  `}
                  style={{ minHeight: '100px' }}
                >
                  {/* Glow Effect */}
                  {isSelected && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED] to-[#a855f7] blur-xl opacity-40 animate-pulse-glow -z-10"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shine"></div>
                    </>
                  )}

                  {/* Content */}
                  <div className="relative z-10 flex flex-col items-center justify-center h-full">
                    <div className={`
                      text-3xl mb-2 transition-all duration-300
                      ${isSelected ? 'scale-110 animate-wiggle' : 'scale-100'}
                      ${isAnimating ? 'animate-icon-pop' : ''}
                    `}>
                      {interest.icon}
                    </div>
                    <p className={`
                      font-black uppercase tracking-wide text-xs text-center leading-tight transition-all duration-300
                      ${isSelected ? 'text-white scale-105' : 'text-gray-300'}
                    `}>
                      {interest.label}
                    </p>
                  </div>

                  {/* Checkmark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow-lg animate-scale-in">
                      <svg className="w-4 h-4 text-[#7C3AED]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}

                  {/* Selection ring effect */}
                  {isAnimating && (
                    <div className="absolute inset-0 rounded-xl border-2 border-[#7C3AED] animate-ring-expand"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue Button */}
        <div className="sticky bottom-0 bg-gradient-to-t from-[#0a0118] via-[#0a0118] to-transparent pt-4 pb-2 animate-slideUp animation-delay-400">
          <button
            onClick={handleContinue}
            disabled={selected.size < 3 || isSubmitting}
            className={`
              w-full group relative overflow-hidden px-8 py-4 rounded-xl font-black text-lg uppercase tracking-wider
              transition-all duration-300 border-2 active:scale-95
              ${selected.size >= 3 && !isSubmitting
                ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white border-[#7C3AED] shadow-2xl shadow-purple-500/50 animate-pulse-subtle'
                : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed opacity-50'
              }
            `}
          >
            <span className="relative z-10 flex items-center gap-2 justify-center">
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  Enter the Arena
                  <svg className={`w-5 h-5 transition-transform ${selected.size >= 3 ? 'group-hover:translate-x-1' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </>
              )}
            </span>
            
            {selected.size >= 3 && !isSubmitting && (
              <>
                <div className="absolute inset-0 bg-gradient-to-r from-[#4c1d95] to-[#7C3AED] opacity-0 group-active:opacity-100 transition-opacity duration-150"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine-slow"></div>
              </>
            )}
          </button>
          
          {selected.size < 3 && !isSubmitting && (
            <p className="text-gray-500 text-xs mt-2 text-center">
              Select {3 - selected.size} more to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
}