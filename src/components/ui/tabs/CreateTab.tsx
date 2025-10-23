// components/ui/tabs/CreateTab.tsx
"use client";
import { useState, useEffect } from 'react';
import { TimePicker } from '../TimePicker';

interface Category {
  id: string;
  label: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'social-media', label: 'Social Media', icon: '📱' },
  { id: 'crypto', label: 'Crypto', icon: '₿' },
  { id: 'politics', label: 'Politics', icon: '🏛️' },
  { id: 'tech', label: 'Tech', icon: '💻' },
];

const SOCIAL_PLATFORMS = [
  { id: 'twitter', label: 'X', icon: '𝕏' },
  { id: 'telegram', label: 'Telegram', icon: '✈️' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'discord', label: 'Discord', icon: '💬' },
];

const STAKE_PRESETS = [10, 25, 50, 100, 250, 500];

export function CreateTab() {
  const [step, setStep] = useState(1);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Form data
  const [challengeTitle, setChallengeTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [winCondition, setWinCondition] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState({ hours: '12', minutes: '00', seconds: '00' });
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState({ hours: '12', minutes: '00', seconds: '00' });
  const [stakeAmount, setStakeAmount] = useState(50);
  const [customStake, setCustomStake] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // Calculate duration
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(`${startDate}T${startTime.hours}:${startTime.minutes}:${startTime.seconds}`);
      const end = new Date(`${endDate}T${endTime.hours}:${endTime.minutes}:${endTime.seconds}`);
      const diff = end.getTime() - start.getTime();
      
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        
        let timeStr = '';
        if (days > 0) timeStr += `${days}d `;
        if (hours > 0) timeStr += `${hours}h `;
        if (mins > 0) timeStr += `${mins}m `;
        timeStr += `${secs}s`;
        setTimeRemaining(timeStr.trim());
      }
    }
  }, [startDate, startTime, endDate, endTime]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setBannerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setBannerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const canGoNext = () => {
    switch(step) {
      case 1: return challengeTitle && selectedCategory;
      case 2: return winCondition;
      case 3: return startDate && endDate;
      case 4: return stakeAmount > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      if (step < 4) {
        setStep(step + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    console.log({ 
      challengeTitle, 
      selectedCategory, 
      description, 
      winCondition, 
      selectedPlatform, 
      startDate,
      startTime,
      endDate,
      endTime,
      stakeAmount, 
      bannerImage 
    });
    setTimeout(() => {
      setIsSubmitting(false);
      // Reset or navigate
    }, 2000);
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-hidden flex flex-col pb-20">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Header - Fixed */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="p-2 rounded-lg bg-black/40 border border-gray-700 text-white active:scale-95 transition-transform"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-9"></div>
          )}
          
          <div className="flex-1 text-center">
            <div className="inline-flex items-center gap-2 bg-black/40 backdrop-blur-md border border-[#7C3AED]/50 rounded-full px-3 py-1 shadow-lg shadow-purple-500/30">
              <span className="text-[#7C3AED] text-xs font-black uppercase tracking-wider">
                Step {step} of 4
              </span>
            </div>
          </div>
          
          <div className="w-9"></div>
        </div>
      </div>

      {/* Content Area - Scrollable with extra padding at bottom */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Step 1: Basic Info & Banner */}
        {step === 1 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Basic Info
              </span>
            </h2>

            {/* Banner Upload */}
            <div 
              className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                isDragging ? 'ring-4 ring-[#7C3AED] scale-[0.98]' : ''
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              {bannerImage ? (
                <div className="relative aspect-[16/9] group">
                  <img src={bannerImage} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-white/20 backdrop-blur-md rounded-lg text-white font-bold text-sm">
                      Change Image
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="block aspect-[16/9] cursor-pointer bg-black/40 backdrop-blur-md border-2 border-dashed border-gray-700 hover:border-[#7C3AED] transition-colors">
                  <div className="h-full flex flex-col items-center justify-center text-center p-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] flex items-center justify-center mb-3">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-white font-bold text-sm mb-1">Upload Banner</p>
                    <p className="text-gray-400 text-xs">Drag & drop or click to browse</p>
                  </div>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>

            {/* Title */}
            <input
              type="text"
              value={challengeTitle}
              onChange={(e) => setChallengeTitle(e.target.value)}
              placeholder="Challenge Title"
              maxLength={80}
              className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 font-bold text-lg transition-all duration-300 outline-none"
            />

            {/* Category Grid */}
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`relative p-4 rounded-xl transition-all duration-300 ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#7C3AED] to-[#a855f7] scale-105 shadow-lg shadow-purple-500/50' 
                        : 'bg-black/40 border-2 border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-2xl">{cat.icon}</span>
                      <span className={`text-[10px] font-black uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {cat.label}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Details */}
        {step === 2 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Challenge Details
              </span>
            </h2>

            {/* Description */}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description (optional)"
              rows={3}
              maxLength={200}
              className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 font-medium transition-all duration-300 outline-none resize-none"
            />

            {/* Win Condition */}
            <textarea
              value={winCondition}
              onChange={(e) => setWinCondition(e.target.value)}
              placeholder="Win Condition - Be specific about what needs to happen"
              rows={4}
              maxLength={300}
              className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 font-medium transition-all duration-300 outline-none resize-none"
            />

            {/* Social Platform */}
            <div>
              <p className="text-white font-bold text-sm mb-2 uppercase tracking-wider">Social Platform (Optional)</p>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const isSelected = selectedPlatform === platform.id;
                  return (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(isSelected ? null : platform.id)}
                      className={`p-3 rounded-lg transition-all duration-300 ${
                        isSelected 
                          ? 'bg-gradient-to-br from-[#7C3AED] to-[#a855f7] scale-105' 
                          : 'bg-black/30 border border-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xl">{platform.icon}</span>
                        <span className={`text-[9px] font-bold uppercase ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                          {platform.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Timing */}
        {step === 3 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Set Timeline
              </span>
            </h2>

            {/* Start Date - With Calendar Icon */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                📅 Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  min={today}
                  className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-base transition-all duration-300 outline-none cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Start Time Picker */}
            <TimePicker
              label="Start Time"
              icon="🚀"
              value={startTime}
              onChange={setStartTime}
            />

            {/* End Date - With Calendar Icon */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                📅 End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || today}
                  className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-base transition-all duration-300 outline-none cursor-pointer"
                  style={{
                    colorScheme: 'dark',
                  }}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* End Time Picker */}
            <TimePicker
              label="End Time"
              icon="🏁"
              value={endTime}
              onChange={setEndTime}
            />

            {/* Duration Display */}
            {timeRemaining && (
              <div className="bg-gradient-to-r from-[#7C3AED]/30 to-[#a855f7]/30 border-2 border-[#7C3AED] rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-200 font-bold text-sm">Duration:</span>
                  <span className="text-white font-black text-xl">{timeRemaining}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Stake */}
        {step === 4 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Set Your Stake
              </span>
            </h2>

            {/* Preset Stakes */}
            <div className="grid grid-cols-3 gap-2">
              {STAKE_PRESETS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => {
                    setStakeAmount(amount);
                    setCustomStake('');
                  }}
                  className={`p-4 rounded-xl font-black text-lg transition-all duration-300 ${
                    stakeAmount === amount && !customStake
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 scale-105'
                      : 'bg-black/40 border-2 border-gray-700 text-gray-300'
                  }`}
                >
                  ${amount}
                </button>
              ))}
            </div>

            {/* Custom Amount */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C3AED] font-black text-2xl">$</div>
              <input
                type="number"
                value={customStake}
                onChange={(e) => {
                  setCustomStake(e.target.value);
                  setStakeAmount(parseFloat(e.target.value) || 0);
                }}
                placeholder="Custom amount"
                min="1"
                className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl pl-10 pr-4 py-4 text-white placeholder-gray-500 font-bold text-xl outline-none"
              />
            </div>

            {/* Total Display */}
            <div className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] rounded-2xl p-6 text-center">
              <p className="text-white/80 font-bold text-sm mb-2 uppercase tracking-wider">Your Stake</p>
              <p className="text-white font-black text-5xl">${stakeAmount.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed, ABOVE the footer navigation */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#0a0118] via-[#0a0118] to-transparent z-40">
        <button
          onClick={handleNext}
          disabled={!canGoNext() || isSubmitting}
          className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 ${
            canGoNext() && !isSubmitting
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 active:scale-95'
              : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating...
            </span>
          ) : step < 4 ? (
            <span className="flex items-center justify-center gap-2">
              Next
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </span>
          ) : (
            '🚀 Launch Challenge'
          )}
        </button>
      </div>
    </div>
  );
}  