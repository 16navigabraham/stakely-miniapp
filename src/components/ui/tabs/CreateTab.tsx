// components/ui/tabs/CreateTab.tsx
"use client";
import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { TimePicker } from '../TimePicker';
import { useCreateChallenge } from '~/hooks/useCreateChallenge';

// ============================================
// CONFIGURATION
// ============================================

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4b637CBe4B1A94CdcDE05c8BACC8C74813273CDf';
const USDC_ADDRESS = process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stakely-backend.onrender.com';

// ============================================
// TYPES
// ============================================

interface Category {
  id: string;
  label: string;
  icon: string;
}

// ============================================
// CONSTANTS
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

export function CreateTab() {
  // ============================================
  // WALLET STATE
  // ============================================
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [farcasterUsername, setFarcasterUsername] = useState<string>('');
  const [showUsernamePrompt, setShowUsernamePrompt] = useState(false);

  // ============================================
  // FORM STATE (Your existing state)
  // ============================================
  const [step, setStep] = useState(1);
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
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
  const [votingDurationHours, setVotingDurationHours] = useState(24);
  
  const [timeRemaining, setTimeRemaining] = useState('');

  const today = new Date().toISOString().split('T')[0];

  // ============================================
  // BLOCKCHAIN INTEGRATION
  // ============================================
  
  const {
    createChallenge,
    loading: isCreating,
    error: createError,
    step: createStep,
    onchainData,
    apiResponse,
    supportsPermit,
    reset: resetCreate,
  } = useCreateChallenge(provider, signer, CONTRACT_ADDRESS, USDC_ADDRESS, API_BASE_URL);

  // ============================================
  // WALLET CONNECTION
  // ============================================

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setProvider(provider);
      setSigner(signer);
      setUserAddress(address);
      setIsConnected(true);
      
      // Prompt for Farcaster username
      setShowUsernamePrompt(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      alert('Failed to connect wallet');
    }
  };

  // Auto-connect on mount
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        });
    }
  }, []);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

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
      setBannerFile(file);
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
      setBannerFile(file);
      const reader = new FileReader();
      reader.onload = () => setBannerImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Convert date to DD/MM/YYYY format
  const formatDateForBackend = (dateStr: string): string => {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format time to HH:MM:SS
  const formatTimeForBackend = (time: { hours: string; minutes: string; seconds: string }): string => {
    return `${time.hours.padStart(2, '0')}:${time.minutes.padStart(2, '0')}:${time.seconds.padStart(2, '0')}`;
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };
      reader.onerror = reject;
    });
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

  // ============================================
  // SUBMIT TO BLOCKCHAIN & BACKEND
  // ============================================

  const handleSubmit = async () => {
    // Check wallet connection
    if (!isConnected || !signer) {
      alert('Please connect your wallet first');
      return;
    }

    // Check Farcaster username
    if (!farcasterUsername) {
      setShowUsernamePrompt(true);
      return;
    }

    // Check banner
    if (!bannerFile) {
      alert('Please upload a banner image');
      return;
    }

    try {
      // Convert banner to base64
      const bannerBase64 = await fileToBase64(bannerFile);

      // Prepare challenge data
      const challengeData = {
        farcasterUsername,
        title: challengeTitle,
        category: selectedCategory!,
        description: description || challengeTitle,
        winCondition,
        startDate: formatDateForBackend(startDate),
        startTime: formatTimeForBackend(startTime),
        endDate: formatDateForBackend(endDate),
        endTime: formatTimeForBackend(endTime),
        stakeAmount,
        votingDurationHours,
        banner: {
          filename: bannerFile.name,
          contentType: bannerFile.type,
          data: bannerBase64,
        },
      };

      console.log('📤 Submitting challenge:', challengeData);

      // Call the hook to create challenge
      await createChallenge(challengeData);

      // If successful, onchainData and apiResponse will be set
    } catch (error: any) {
      console.error('❌ Submit error:', error);
      alert(`Error: ${error.message || 'Failed to create challenge'}`);
    }
  };

  // ============================================
  // SUCCESS HANDLER
  // ============================================

  useEffect(() => {
    if (createStep === 'success' && onchainData) {
      // Show success message
      setTimeout(() => {
        alert(`🎉 Challenge #${onchainData.challengeId} created successfully!\n\nTransaction: ${onchainData.txHash}`);
        
        // Reset form
        resetForm();
      }, 1000);
    }
  }, [createStep, onchainData]);

  const resetForm = () => {
    setStep(1);
    setChallengeTitle('');
    setSelectedCategory(null);
    setDescription('');
    setWinCondition('');
    setSelectedPlatform(null);
    setStartDate('');
    setStartTime({ hours: '12', minutes: '00', seconds: '00' });
    setEndDate('');
    setEndTime({ hours: '12', minutes: '00', seconds: '00' });
    setStakeAmount(50);
    setCustomStake('');
    setBannerImage(null);
    setBannerFile(null);
    setVotingDurationHours(24);
    resetCreate();
  };

  // ============================================
  // GET PROGRESS MESSAGE
  // ============================================

  const getProgressMessage = () => {
    switch (createStep) {
      case 'checking_permit':
        return '🔍 Checking permit support...';
      case 'signing_permit':
        return '📝 Please sign the permit message in your wallet...';
      case 'approving':
        return '⏳ Approving USDC... (Transaction 1/2)';
      case 'creating':
        return '⏳ Creating challenge on blockchain...';
      case 'waiting_confirmation':
        return '⏳ Waiting for transaction confirmation...';
      case 'saving_to_api':
        return '💾 Saving challenge details to database...';
      case 'success':
        return '✅ Challenge created successfully!';
      case 'error':
        return `❌ ${createError || 'An error occurred'}`;
      default:
        return '';
    }
  };

  // ============================================
  // RENDER - USERNAME PROMPT
  // ============================================

  if (showUsernamePrompt && !farcasterUsername) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-xl border-2 border-[#7C3AED] rounded-2xl p-8 max-w-md w-full">
          <h2 className="text-2xl font-black text-white mb-4 text-center uppercase">
            Enter Farcaster Username
          </h2>
          <p className="text-gray-400 text-sm mb-6 text-center">
            Connected: {userAddress?.slice(0, 6)}...{userAddress?.slice(-4)}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const input = e.target as any;
              const username = input.username.value.trim();
              if (username) {
                setFarcasterUsername(username);
                setShowUsernamePrompt(false);
              }
            }}
            className="space-y-4"
          >
            <input
              name="username"
              type="text"
              placeholder="abrahamnavig"
              className="w-full bg-black/40 border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white rounded-xl font-bold"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - CONNECT WALLET
  // ============================================

  if (!isConnected) {
    return (
      <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] flex items-center justify-center p-4">
        <div className="bg-black/60 backdrop-blur-xl border-2 border-[#7C3AED] rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔗</div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase">
            Connect Wallet
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            Connect your wallet to create challenges
          </p>
          <button
            onClick={connectWallet}
            className="w-full py-4 bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            Connect Wallet
          </button>
          
          <div className="mt-6 space-y-2 text-left text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Single-transaction creation on Base</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✅</span>
              <span>Secure smart contract integration</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - MAIN FORM (Your existing UI)
  // ============================================

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
              disabled={isCreating}
              className="p-2 rounded-lg bg-black/40 border border-gray-700 text-white active:scale-95 transition-transform disabled:opacity-50"
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
          
          <button
            onClick={() => setShowUsernamePrompt(true)}
            className="text-xs text-gray-400 hover:text-white"
          >
            @{farcasterUsername}
          </button>
        </div>
      </div>

      {/* Blockchain Status Banner */}
      {isCreating && (
        <div className="px-4 pb-2">
          <div className="bg-[#7C3AED]/20 border border-[#7C3AED] rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm font-medium">
                {getProgressMessage()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {createError && (
        <div className="px-4 pb-2">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-3">
            <p className="text-white text-sm">❌ {createError}</p>
            <button
              onClick={resetCreate}
              className="text-red-400 text-xs underline mt-1"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

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
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <label className="cursor-pointer bg-white/20 backdrop-blur-md border-2 border-white rounded-xl px-6 py-3 text-white font-bold">
                      Change Banner
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-[16/9] bg-black/40 border-2 border-dashed border-gray-600 hover:border-[#7C3AED] cursor-pointer transition-all duration-300">
                  <div className="text-center p-4">
                    <div className="text-5xl mb-3">🖼️</div>
                    <p className="text-white font-bold text-lg mb-2">Upload Banner</p>
                    <p className="text-gray-400 text-sm">Drag & drop or click to browse</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Challenge Title */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                🏆 Challenge Title
              </label>
              <input
                type="text"
                value={challengeTitle}
                onChange={(e) => setChallengeTitle(e.target.value)}
                placeholder="Bitcoin reaches $100k"
                maxLength={100}
                className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 font-bold text-lg outline-none transition-all duration-300"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                📂 Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-xl font-bold transition-all duration-300 ${
                      selectedCategory === cat.id
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50'
                        : 'bg-black/40 border-2 border-gray-700 text-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{cat.icon}</span>
                    <span className="text-xs">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                📝 Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more context about your challenge..."
                rows={3}
                maxLength={500}
                className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Win Condition */}
        {step === 2 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Win Condition
              </span>
            </h2>

            <div className="bg-black/40 border-2 border-[#7C3AED]/50 rounded-2xl p-6">
              <p className="text-gray-300 text-sm mb-4">
                Define what needs to happen for this challenge to be successful. Be specific and measurable.
              </p>
              <textarea
                value={winCondition}
                onChange={(e) => setWinCondition(e.target.value)}
                placeholder="E.g., Bitcoin price reaches or exceeds $100,000 on any major exchange by the end date"
                rows={4}
                maxLength={500}
                className="w-full bg-black/40 border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white placeholder-gray-500 outline-none resize-none"
              />
            </div>

            {/* Social Platform (Optional) */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                📱 Social Platform (Optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SOCIAL_PLATFORMS.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id === selectedPlatform ? null : platform.id)}
                    className={`p-3 rounded-xl font-bold transition-all duration-300 ${
                      selectedPlatform === platform.id
                        ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white'
                        : 'bg-black/40 border-2 border-gray-700 text-gray-300'
                    }`}
                  >
                    <span className="text-xl block mb-1">{platform.icon}</span>
                    <span className="text-xs">{platform.label}</span>
                  </button>
                ))}
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

            {/* Start Date */}
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
                  className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-sm transition-all duration-300 outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Start Time Picker */}
            <TimePicker
              label="Start Time"
              icon="🚀"
              value={startTime}
              onChange={setStartTime}
            />

            {/* End Date */}
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
                  className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-sm transition-all duration-300 outline-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* End Time Picker */}
            <TimePicker
              label="End Time"
              icon="🏁"
              value={endTime}
              onChange={setEndTime}
            />

            {/* Voting Duration */}
            <div>
              <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                🗳️ Voting Duration (hours)
              </label>
              <input
                type="number"
                value={votingDurationHours}
                onChange={(e) => setVotingDurationHours(Number(e.target.value))}
                min="1"
                max="168"
                className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl px-4 py-3 text-white font-bold text-sm outline-none"
              />
              <p className="text-gray-400 text-xs mt-1">
                Community voting period after challenge ends (1-168 hours)
              </p>
            </div>

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

            {/* Permit Support Info */}
            {supportsPermit !== null && (
              <div className={`p-3 rounded-xl border-2 ${
                supportsPermit 
                  ? 'bg-green-500/20 border-green-500' 
                  : 'bg-yellow-500/20 border-yellow-500'
              }`}>
                <p className="text-white text-xs">
                  {supportsPermit 
                    ? '✅ Single-transaction creation enabled!'
                    : '⚠️ Two-transaction flow (approve + create)'}
                </p>
              </div>
            )}

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
              <p className="text-white font-black text-5xl">${stakeAmount.toFixed(2)} USDC</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation - Fixed, ABOVE the footer navigation */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#0a0118] via-[#0a0118] to-transparent z-40">
        <button
          onClick={handleNext}
          disabled={!canGoNext() || isCreating}
          className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 ${
            canGoNext() && !isCreating
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 active:scale-95'
              : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
          }`}
        >
          {isCreating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {getProgressMessage()}
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