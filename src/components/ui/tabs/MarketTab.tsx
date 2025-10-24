// components/ui/tabs/MarketTab.tsx
"use client";
import { useEffect, useState } from 'react';
import { BetModal } from '../BetModal';

type ChallengeStatus = 'active' | 'voting' | 'finalized';

interface UserBet {
  side: 'yes' | 'no';
  amount: number;
}

interface VoteData {
  yesVotes: number;
  noVotes: number;
  totalVoters: number;
  userVoted?: 'yes' | 'no' | null;
}

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
  status: ChallengeStatus;
  userBet?: UserBet;
  voteData?: VoteData;
  finalOutcome?: 'yes' | 'no';
  winnerStake?: number;
  loserStake?: number;
}

const CATEGORIES = ['All', 'Sports', 'Crypto', 'Entertainment', 'Social Media', 'Tech', 'Politics', 'Weather'];

export function MarketTab() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const now = new Date();
    setChallenges([
      {
        id: 1,
        title: "Lakers vs Warriors - Will Lakers win?",
        banner: "🏀",
        category: "Sports",
        creator: "@SportsBetter",
        endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000),
        totalStaked: 1500,
        yesPercentage: 65,
        noPercentage: 35,
        participants: 24,
        status: 'active',
      },
      {
        id: 2,
        title: "Bitcoin hits $100K this week?",
        banner: "₿",
        category: "Crypto",
        creator: "@CryptoKing",
        endTime: new Date(now.getTime() - 1000),
        totalStaked: 5200,
        yesPercentage: 45,
        noPercentage: 55,
        participants: 89,
        status: 'voting',
        userBet: { side: 'yes', amount: 100 },
        voteData: {
          yesVotes: 42,
          noVotes: 35,
          totalVoters: 77,
          userVoted: null,
        },
      },
      {
        id: 3,
        title: "Elon Musk will tweet about Mars today?",
        banner: "🚀",
        category: "Social Media",
        creator: "@SpaceWatcher",
        endTime: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        totalStaked: 800,
        yesPercentage: 80,
        noPercentage: 20,
        participants: 15,
        status: 'finalized',
        userBet: { side: 'yes', amount: 50 },
        finalOutcome: 'yes',
        winnerStake: 640,
        loserStake: 160,
        voteData: {
          yesVotes: 48,
          noVotes: 12,
          totalVoters: 60,
          userVoted: 'yes',
        },
      },
      {
        id: 4,
        title: "Next Marvel Movie will gross $1B+?",
        banner: "🎬",
        category: "Entertainment",
        creator: "@MovieBuff",
        endTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000),
        totalStaked: 2100,
        yesPercentage: 72,
        noPercentage: 28,
        participants: 56,
        status: 'active',
      },
      {
        id: 5,
        title: "Will it rain in NYC tomorrow?",
        banner: "🌧️",
        category: "Weather",
        creator: "@WeatherPro",
        endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        totalStaked: 450,
        yesPercentage: 38,
        noPercentage: 62,
        participants: 12,
        status: 'active',
      },
      {
        id: 6,
        title: "Will Apple announce new product this month?",
        banner: "📱",
        category: "Tech",
        creator: "@TechGuru",
        endTime: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        totalStaked: 3200,
        yesPercentage: 55,
        noPercentage: 45,
        participants: 67,
        status: 'finalized',
        userBet: { side: 'no', amount: 75 },
        finalOutcome: 'no',
        winnerStake: 1440,
        loserStake: 1760,
        voteData: {
          yesVotes: 28,
          noVotes: 52,
          totalVoters: 80,
          userVoted: 'no',
        },
      }
    ]);
  }, []);

  const filteredChallenges = selectedCategory === 'All' 
    ? challenges 
    : challenges.filter(c => c.category === selectedCategory);

  const handleCardClick = (challengeId: number) => {
    setExpandedCard(expandedCard === challengeId ? null : challengeId);
  };

  const handleBuyClick = (challenge: Challenge, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedChallenge(challenge);
  };

  const handlePlaceBet = (side: 'yes' | 'no', amount: string) => {
    console.log({
      challenge: selectedChallenge?.id,
      side,
      amount: parseFloat(amount)
    });
    
    // Close modal
    setSelectedChallenge(null);
    
    // Show success message (you can add a toast here)
    alert(`Bet placed: ${side.toUpperCase()} with $${amount}`);
  };

  const handleVote = (challengeId: number, vote: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    setChallenges(prev => prev.map(c => {
      if (c.id === challengeId && c.voteData) {
        return {
          ...c,
          voteData: {
            ...c.voteData,
            yesVotes: vote === 'yes' ? c.voteData.yesVotes + 1 : c.voteData.yesVotes,
            noVotes: vote === 'no' ? c.voteData.noVotes + 1 : c.voteData.noVotes,
            totalVoters: c.voteData.totalVoters + 1,
            userVoted: vote,
          }
        };
      }
      return c;
    }));
  };

  const calculateDistribution = (challenge: Challenge) => {
    if (!challenge.userBet || !challenge.finalOutcome) return null;
    
    const userWon = challenge.userBet.side === challenge.finalOutcome;
    const totalLossPool = challenge.finalOutcome === 'yes' ? challenge.loserStake! : challenge.loserStake!;
    const totalWinnerStake = challenge.finalOutcome === 'yes' ? challenge.winnerStake! : challenge.winnerStake!;
    
    if (userWon) {
      const userShare = (challenge.userBet.amount / totalWinnerStake) * totalLossPool;
      return {
        won: true,
        returned: challenge.userBet.amount,
        profit: userShare,
        total: challenge.userBet.amount + userShare,
      };
    } else {
      return {
        won: false,
        lost: challenge.userBet.amount,
      };
    }
  };

  return (
    <div className="min-h-screen">
      <div className="animate-slideUp">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 
              className="text-2xl font-black text-white uppercase tracking-tight leading-none" 
              style={{ fontFamily: '"Bebas Neue", sans-serif' }}
            >
              🔥 Live Markets
            </h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {filteredChallenges.length} predictions
            </p>
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-1.5 border rounded-lg text-xs font-bold active:scale-95 transition-all ${
              showFilters 
                ? 'bg-[#7C3AED] border-[#7C3AED] text-white' 
                : 'bg-[#7C3AED]/20 border-[#7C3AED]/50 text-[#7C3AED] hover:bg-[#7C3AED]/30'
            }`}
          >
            {showFilters ? '✓' : '☰'} Filter
          </button>
        </div>

        {/* Filter Categories */}
        {showFilters && (
          <div className="mb-3 animate-slideUp">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white scale-105'
                      : 'bg-black/40 border border-purple-500/30 text-gray-400 hover:border-purple-500/60'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Challenge Grid */}
        <div className="space-y-3 pb-6">
          {filteredChallenges.map((challenge, index) => {
            const isExpanded = expandedCard === challenge.id;
            
            return (
              <div
                key={challenge.id}
                className="animate-slideUp"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {challenge.status === 'active' ? (
                  <CompactActiveCard
                    challenge={challenge}
                    isExpanded={isExpanded}
                    onCardClick={() => handleCardClick(challenge.id)}
                    onBuyClick={(e) => handleBuyClick(challenge, e)}
                  />
                ) : challenge.status === 'voting' ? (
                  <CompactVotingCard
                    challenge={challenge}
                    isExpanded={isExpanded}
                    onCardClick={() => handleCardClick(challenge.id)}
                    onVote={(vote, e) => handleVote(challenge.id, vote, e)}
                  />
                ) : (
                  <CompactFinalizedCard
                    challenge={challenge}
                    isExpanded={isExpanded}
                    onCardClick={() => handleCardClick(challenge.id)}
                    distribution={calculateDistribution(challenge)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* New Professional Bet Modal */}
      {selectedChallenge && (
        <BetModal
          challenge={selectedChallenge}
          onClose={() => setSelectedChallenge(null)}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </div>
  );
}

// Rest of the component code remains the same...
// (I'll include the card components but they're identical to before)

function CompactActiveCard({ 
  challenge, 
  isExpanded,
  onCardClick,
  onBuyClick
}: { 
  challenge: Challenge;
  isExpanded: boolean;
  onCardClick: () => void;
  onBuyClick: (e: React.MouseEvent) => void;
}) {
  return (
    <div 
      onClick={onCardClick}
      className="bg-gradient-to-br from-[#1a0b2e]/80 to-[#0a0118]/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 hover:border-purple-500/60 transition-all cursor-pointer active:scale-[0.98]"
    >
      <div className="flex items-start gap-3 mb-2.5">
        <div className="text-3xl">{challenge.banner}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-white leading-tight line-clamp-2 mb-1">
            {challenge.title}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <CountdownTimer endTime={challenge.endTime} />
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">{challenge.participants} 👥</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-white font-black text-sm">${challenge.totalStaked}</span>
          <span className="text-xs text-gray-500">pool</span>
        </div>
      </div>

      <div className="mb-2.5">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-green-400 font-bold">{challenge.yesPercentage}%</span>
          <span className="text-red-400 font-bold">{challenge.noPercentage}%</span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
            style={{ width: `${challenge.yesPercentage}%` }}
          />
          <div 
            className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
            style={{ width: `${challenge.noPercentage}%` }}
          />
        </div>
      </div>

      {isExpanded && (
        <div className="animate-slideUp pt-2 border-t border-purple-500/20">
          <div className="mb-2.5 text-xs text-gray-400 leading-relaxed">
            <p className="mb-1"><span className="text-gray-300 font-semibold">Category:</span> {challenge.category}</p>
            <p><span className="text-gray-300 font-semibold">Created by:</span> {challenge.creator}</p>
          </div>
        </div>
      )}

      <button
        onClick={onBuyClick}
        className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg text-white font-black text-sm hover:from-purple-500 hover:to-pink-500 transition-all active:scale-95 shadow-lg"
        style={{ boxShadow: '0 5px 20px rgba(168, 85, 247, 0.4)' }}
      >
        Place Your Bet 🎯
      </button>
    </div>
  );
}

function CompactVotingCard({ 
  challenge,
  isExpanded,
  onCardClick,
  onVote
}: { 
  challenge: Challenge;
  isExpanded: boolean;
  onCardClick: () => void;
  onVote: (vote: 'yes' | 'no', e: React.MouseEvent) => void;
}) {
  const votePercentage = challenge.voteData 
    ? (challenge.voteData.yesVotes / challenge.voteData.totalVoters) * 100
    : 50;

  return (
    <div 
      onClick={onCardClick}
      className="bg-gradient-to-br from-[#1a0b2e] to-[#0a0118] border-2 border-orange-500/50 rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all"
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-orange-500/30 to-amber-500/30 border border-orange-500/50 rounded-full">
          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"></span>
          <span className="text-xs text-orange-300 font-black">🗳️ VOTING</span>
        </div>
        <span className="text-xs text-gray-400">{challenge.voteData?.totalVoters || 0} voters</span>
      </div>

      <div className="flex items-start gap-3 mb-2.5">
        <div className="text-3xl">{challenge.banner}</div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white leading-tight line-clamp-2 mb-1">
            {challenge.title}
          </h3>
          {challenge.userBet && (
            <div className="text-xs">
              <span className="text-gray-400">Your bet: </span>
              <span className={challenge.userBet.side === 'yes' ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {challenge.userBet.side.toUpperCase()} ${challenge.userBet.amount}
              </span>
            </div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="animate-slideUp pt-2 border-t border-orange-500/20 mb-2.5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                  style={{ width: `${votePercentage}%` }}
                />
              </div>
              <span className="text-green-400 font-black text-xs min-w-[50px] text-right">
                {challenge.voteData?.yesVotes || 0} YES
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                  style={{ width: `${100 - votePercentage}%` }}
                />
              </div>
              <span className="text-red-400 font-black text-xs min-w-[50px] text-right">
                {challenge.voteData?.noVotes || 0} NO
              </span>
            </div>
          </div>
        </div>
      )}

      {challenge.userBet && !challenge.voteData?.userVoted ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => onVote('yes', e)}
            className="py-2.5 bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/50 rounded-lg font-black text-xs hover:from-green-500 hover:to-green-600 transition-all active:scale-95"
          >
            <span className="text-green-400 hover:text-white flex items-center justify-center gap-1">
              ✓ YES
            </span>
          </button>
          <button
            onClick={(e) => onVote('no', e)}
            className="py-2.5 bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/50 rounded-lg font-black text-xs hover:from-red-500 hover:to-red-600 transition-all active:scale-95"
          >
            <span className="text-red-400 hover:text-white flex items-center justify-center gap-1">
              ✗ NO
            </span>
          </button>
        </div>
      ) : challenge.voteData?.userVoted ? (
        <div className="py-2 px-3 bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-400/50 rounded-lg text-center">
          <span className="text-white font-bold text-xs">
            ✓ Voted {challenge.voteData.userVoted.toUpperCase()}
          </span>
        </div>
      ) : (
        <div className="py-2 px-3 bg-black/40 border border-gray-500/30 rounded-lg text-center">
          <span className="text-gray-400 text-xs">Only participants can vote</span>
        </div>
      )}
    </div>
  );
}

function CompactFinalizedCard({ 
  challenge,
  isExpanded,
  onCardClick,
  distribution
}: { 
  challenge: Challenge;
  isExpanded: boolean;
  onCardClick: () => void;
  distribution: any;
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`border-2 rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-all ${
        distribution?.won 
          ? 'bg-gradient-to-br from-[#1a0b2e] to-[#0a0118] border-green-500/50' 
          : 'bg-gradient-to-br from-[#1a0b2e] to-[#0a0118] border-red-500/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className={`flex items-center gap-1.5 px-2 py-1 border rounded-full ${
          distribution?.won
            ? 'bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-green-500/50'
            : 'bg-gradient-to-r from-red-500/30 to-rose-500/30 border-red-500/50'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            distribution?.won ? 'bg-green-400' : 'bg-red-400'
          }`}></span>
          <span className={`text-xs font-black ${
            distribution?.won ? 'text-green-300' : 'text-red-300'
          }`}>
            {distribution?.won ? '🎉 WON' : '😢 LOST'}
          </span>
        </div>
        <span className="text-xs text-gray-400">Finalized</span>
      </div>

      <div className="flex items-start gap-3 mb-2.5">
        <div className="text-3xl">{challenge.banner}</div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-white leading-tight line-clamp-2 mb-1">
            {challenge.title}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-400">Outcome:</span>
            <span className={`font-black ${challenge.finalOutcome === 'yes' ? 'text-green-400' : 'text-red-400'}`}>
              {challenge.finalOutcome?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {challenge.userBet && distribution && (
        <div className={`p-2.5 border rounded-lg mb-2 ${
          distribution.won
            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/50'
            : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-red-500/50'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300">
              Your {challenge.userBet.side.toUpperCase()} ${challenge.userBet.amount}
            </span>
            <span className={`font-black text-sm ${
              distribution.won ? 'text-green-400' : 'text-red-400'
            }`}>
              {distribution.won ? `+$${distribution.profit.toFixed(2)}` : `-$${distribution.lost.toFixed(2)}`}
            </span>
          </div>
          {distribution.won && (
            <div className="text-xs text-gray-400 mt-1">
              Total received: <span className="text-white font-bold">${distribution.total.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {isExpanded && distribution && (
        <div className="animate-slideUp pt-2 border-t border-purple-500/20">
          <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between text-gray-400">
                <span>Community Vote:</span>
                <span className="text-white font-bold">
                  {challenge.voteData && Math.round((
                    challenge.finalOutcome === 'yes' 
                      ? challenge.voteData.yesVotes 
                      : challenge.voteData.noVotes
                  ) / challenge.voteData.totalVoters * 100)}% agreed
                </span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Winner Pool:</span>
                <span className="text-green-400 font-bold">${challenge.winnerStake}</span>
              </div>
              <div className="flex justify-between text-gray-400">
                <span>Loss Pool:</span>
                <span className="text-red-400 font-bold">${challenge.loserStake}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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

      if (days > 0) setTimeLeft(`${days}d ${hours}h`);
      else if (hours > 0) setTimeLeft(`${hours}h ${minutes}m`);
      else setTimeLeft(`${minutes}m`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded text-orange-400 font-black">
      ⏱️ {timeLeft}
    </span>
  );
}