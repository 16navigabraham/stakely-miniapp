// components/ui/tabs/MarketTab.tsx
"use client";
import { useEffect, useState } from 'react';

interface Challenge {
  id: number;
  title: string;
  banner: string;
  category: string;
  creator: string;
  endTime: Date;
  totalStaked: number;
  yesPercentage: number;
  noPercentage: number;
  participants: number;
}

const CATEGORIES = ['All', 'Sports', 'Crypto', 'Entertainment', 'Social Media', 'Tech', 'Politics', 'Weather'];

export function MarketTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedSide, setSelectedSide] = useState<'yes' | 'no' | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Load mock challenges with future dates
    const now = new Date();
    setChallenges([
      {
        id: 1,
        title: "Lakers vs Warriors - Will Lakers win?",
        banner: "🏀",
        category: "Sports",
        creator: "@SportsBetter",
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000), // 2h 45m
        totalStaked: 1500,
        yesPercentage: 65,
        noPercentage: 35,
        participants: 24,
      },
      {
        id: 2,
        title: "Bitcoin hits $100K this week?",
        banner: "₿",
        category: "Crypto",
        creator: "@CryptoKing",
        endTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000), // 5d 12h
        totalStaked: 5200,
        yesPercentage: 45,
        noPercentage: 55,
        participants: 89,
      },
      {
        id: 3,
        title: "Elon Musk will tweet about Mars today?",
        banner: "🚀",
        category: "Social Media",
        creator: "@SpaceWatcher",
        endTime: new Date(now.getTime() + 8 * 60 * 60 * 1000 + 20 * 60 * 1000), // 8h 20m
        totalStaked: 800,
        yesPercentage: 80,
        noPercentage: 20,
        participants: 15,
      },
      {
        id: 4,
        title: "Next Marvel Movie will gross $1B+?",
        banner: "🎬",
        category: "Entertainment",
        creator: "@MovieBuff",
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000), // 3d 5h
        totalStaked: 2100,
        yesPercentage: 72,
        noPercentage: 28,
        participants: 56,
      },
      {
        id: 5,
        title: "Will it rain in NYC tomorrow?",
        banner: "🌧️",
        category: "Weather",
        creator: "@WeatherPro",
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000), // 1d 2h
        totalStaked: 450,
        yesPercentage: 38,
        noPercentage: 62,
        participants: 12,
      },
      {
        id: 6,
        title: "Will Apple announce new product this month?",
        banner: "📱",
        category: "Tech",
        creator: "@TechGuru",
        endTime: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000), // 10 days
        totalStaked: 3200,
        yesPercentage: 55,
        noPercentage: 45,
        participants: 67,
      }
    ]);
  }, []);

  const filteredChallenges = selectedCategory === 'All' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  const handleBuyClick = (challenge: Challenge, side: 'yes' | 'no') => {
    setSelectedChallenge(challenge);
    setSelectedSide(side);
  };

  const handlePlaceBet = () => {
    if (!stakeAmount || !selectedChallenge || !selectedSide) return;
    
    console.log({
      challenge: selectedChallenge.id,
      side: selectedSide,
      amount: parseFloat(stakeAmount)
    });
    
    // Reset
    setSelectedChallenge(null);
    setSelectedSide(null);
    setStakeAmount('');
  };

  const handleShare = async (challenge: Challenge) => {
    const shareData = {
      title: challenge.title,
      text: `Check out this challenge: ${challenge.title} - ${challenge.yesPercentage}% say Yes!`,
      url: `https://app.com/challenge/${challenge.id}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="animate-slideUp pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 
            className="text-3xl font-black text-white uppercase tracking-tight leading-none" 
            style={{ fontFamily: '"Bebas Neue", sans-serif' }}
          >
            🔥 Live Markets
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            {filteredChallenges.length} active predictions
          </p>
        </div>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2 bg-[#7C3AED]/20 border border-[#7C3AED]/50 rounded-lg text-[#7C3AED] text-sm font-bold hover:bg-[#7C3AED]/30 active:scale-95 transition-all"
        >
          Filter
        </button>
      </div>

      {/* Filter Categories */}
      {showFilters && (
        <div className="mb-4 animate-slideUp">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50'
                    : 'bg-black/40 border border-gray-700 text-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Challenge Cards */}
      <div className="space-y-3">
        {filteredChallenges.map((challenge) => (
          <div 
            key={challenge.id} 
            className="bg-black/40 backdrop-blur-md border border-gray-800 rounded-xl overflow-hidden hover:border-[#7C3AED]/50 transition-all"
          >
            {/* Banner with Category & Countdown */}
            <div className="relative bg-gradient-to-br from-[#7C3AED]/20 to-purple-900/20 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center text-2xl flex-shrink-0">
                {challenge.banner}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] px-2 py-0.5 bg-black/40 text-[#7C3AED] rounded-full font-bold uppercase">
                    {challenge.category}
                  </span>
                  <CountdownTimer endTime={challenge.endTime} />
                </div>
                <h3 className="text-white font-black text-sm leading-tight">
                  {challenge.title}
                </h3>
              </div>
              
              {/* Share Button */}
              <button
                onClick={() => handleShare(challenge)}
                className="p-2 rounded-lg bg-black/40 border border-gray-700 text-gray-300 hover:text-white hover:border-[#7C3AED]/50 active:scale-95 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>
            </div>

            {/* Stats Row */}
            <div className="px-4 py-2 bg-black/20 border-b border-gray-800 flex items-center justify-between text-xs">
              <div className="text-gray-400">
                by <span className="text-[#7C3AED] font-bold">{challenge.creator}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">
                  👥 {challenge.participants}
                </span>
                <span className="text-green-400 font-bold">
                  💰 ${challenge.totalStaked}
                </span>
              </div>
            </div>

            {/* Yes/No Options */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 mb-2">
                {/* Yes Button */}
                <button
                  onClick={() => handleBuyClick(challenge, 'yes')}
                  className="group bg-gradient-to-br from-green-500/20 to-green-600/20 border-2 border-green-500/50 rounded-lg p-3 active:scale-95 transition-all hover:border-green-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-black text-xs uppercase">Yes</span>
                    <span className="text-green-400 font-black text-lg">{challenge.yesPercentage}%</span>
                  </div>
                  <div className="text-green-400 text-xs font-bold">
                    Support
                  </div>
                </button>

                {/* No Button */}
                <button
                  onClick={() => handleBuyClick(challenge, 'no')}
                  className="group bg-gradient-to-br from-red-500/20 to-red-600/20 border-2 border-red-500/50 rounded-lg p-3 active:scale-95 transition-all hover:border-red-400"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-black text-xs uppercase">No</span>
                    <span className="text-red-400 font-black text-lg">{challenge.noPercentage}%</span>
                  </div>
                  <div className="text-red-400 text-xs font-bold">
                    Oppose
                  </div>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400"
                  style={{ width: `${challenge.yesPercentage}%` }}
                />
              </div>

              {/* End Date */}
              <div className="mt-2 text-center text-xs text-gray-500">
                Ends: {challenge.endTime.toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredChallenges.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400 text-sm">No challenges found in this category</p>
        </div>
      )}

      {/* Load More */}
      {filteredChallenges.length > 0 && (
        <button className="w-full mt-4 py-3 bg-black/40 border border-gray-800 rounded-xl text-gray-400 text-sm font-bold hover:border-[#7C3AED]/50 hover:text-white active:scale-98 transition-all">
          Load More Markets
        </button>
      )}

      {/* Bet Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-end justify-center p-0" onClick={() => setSelectedChallenge(null)}>
          <div 
            className="bg-gradient-to-br from-[#1a0f3a] to-[#0a0118] border-t-2 border-[#7C3AED] rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-br from-[#1a0f3a] to-[#0a0118] border-b border-gray-800 p-4 flex items-center justify-between">
              <h3 className="text-white font-black text-lg uppercase">Place Your Bet</h3>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="p-2 rounded-lg bg-black/40 border border-gray-700 text-white active:scale-95 transition-transform"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Challenge Info */}
              <div className="bg-black/40 border border-gray-800 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#a855f7] flex items-center justify-center text-xl">
                    {selectedChallenge.banner}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-bold text-sm leading-tight mb-1">
                      {selectedChallenge.title}
                    </h4>
                    <CountdownTimer endTime={selectedChallenge.endTime} />
                  </div>
                </div>
              </div>

              {/* Side Selection */}
              <div>
                <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                  Your Position
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedSide('yes')}
                    className={`p-4 rounded-xl font-black uppercase transition-all ${
                      selectedSide === 'yes'
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white scale-105 shadow-lg shadow-green-500/50'
                        : 'bg-black/40 border-2 border-gray-700 text-gray-400'
                    }`}
                  >
                    ✓ Yes {selectedChallenge.yesPercentage}%
                  </button>
                  <button
                    onClick={() => setSelectedSide('no')}
                    className={`p-4 rounded-xl font-black uppercase transition-all ${
                      selectedSide === 'no'
                        ? 'bg-gradient-to-br from-red-500 to-red-600 text-white scale-105 shadow-lg shadow-red-500/50'
                        : 'bg-black/40 border-2 border-gray-700 text-gray-400'
                    }`}
                  >
                    ✗ No {selectedChallenge.noPercentage}%
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-white font-bold text-sm mb-2 uppercase tracking-wider">
                  Stake Amount
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7C3AED] font-black text-xl">$</div>
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    className="w-full bg-black/40 backdrop-blur-md border-2 border-gray-700 focus:border-[#7C3AED] rounded-xl pl-8 pr-4 py-3 text-white placeholder-gray-500 font-bold text-lg outline-none"
                  />
                </div>
                
                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[10, 25, 50, 100].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setStakeAmount(amount.toString())}
                      className="py-2 bg-black/40 border border-gray-700 rounded-lg text-gray-300 text-sm font-bold hover:border-[#7C3AED] active:scale-95 transition-all"
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Potential Return */}
              {stakeAmount && selectedSide && (
                <div className="bg-gradient-to-r from-[#7C3AED]/20 to-[#a855f7]/20 border border-[#7C3AED] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-300 text-sm">Potential Return:</span>
                    <span className="text-white font-black text-xl">
                      ${(parseFloat(stakeAmount) * 2).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>If you win</span>
                    <span className="text-green-400 font-bold">+{((parseFloat(stakeAmount) / parseFloat(stakeAmount)) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              )}

              {/* Place Bet Button */}
              <button
                onClick={handlePlaceBet}
                disabled={!stakeAmount || !selectedSide}
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all ${
                  stakeAmount && selectedSide
                    ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 active:scale-95'
                    : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
                }`}
              >
                🚀 Place Bet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Countdown Timer Component
function CountdownTimer({ endTime }: { endTime: Date }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = endTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      let display = '';
      if (days > 0) display += `${days}d `;
      if (hours > 0 || days > 0) display += `${hours}h `;
      if (minutes > 0 || hours > 0 || days > 0) display += `${minutes}m `;
      display += `${seconds}s`;

      setTimeLeft(display.trim());
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className="text-[10px] text-orange-400 font-bold flex items-center gap-1">
      ⏱️ {timeLeft}
    </span>
  );
}