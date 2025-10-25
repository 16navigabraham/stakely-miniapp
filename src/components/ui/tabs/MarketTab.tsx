// components/ui/tabs/MarketTab.tsx
"use client";
import { useState, useEffect } from 'react';
import { BetModal } from '../BetModal';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { useMiniApp } from '@neynar/react';
import { useNeynarUser } from '~/hooks/useNeynarUser';
import { getNeynarUsername } from '~/lib/neynarUtils';
import { signPermit, formatUSDCAmount } from '~/utils/permit-wagmi';

// ============================================
// CONFIGURATION
// ============================================

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4b637CBe4B1A94CdcDE05c8BACC8C74813273CDf') as Address;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stakely-backend.onrender.com';

// ============================================
// TYPES
// ============================================

type ChallengeStatus = 'active' | 'voting' | 'completed';
type FilterType = 'all' | 'active' | 'voting';

interface Challenge {
  id: number | string;
  title: string;
  category: string;
  description: string;
  winCondition: string;
  creator?: string;
  totalStaked: number;
  yesPercentage: number;
  noPercentage: number;
  participants: number;
  status: ChallengeStatus;
  timeRemaining?: {
    humanReadable: string;
    expired: boolean;
  };
  votingTimeRemaining?: {
    humanReadable: string;
    expired: boolean;
  };
  stakePool?: {
    total: number;
    yes: number;
    no: number;
  };
  votes?: {
    total: number;
    yes: number;
    no: number;
    yesPercentage: number;
  };
  endDateTime?: string;
  voteEndDateTime?: string;
  banner?: string;
}

// ============================================
// ABI DEFINITIONS
// ============================================

const USDC_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const CONTRACT_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_isFor', type: 'bool' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'stakeWithPermit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_isFor', type: 'bool' },
      { name: '_amount', type: 'uint256' },
      { name: 'permitDeadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'vote',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_voteFor', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'canVote',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_user', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

// ============================================
// MAIN COMPONENT
// ============================================

export function MarketTab() {
  // ============================================
  // HOOKS
  // ============================================
  const { context } = useMiniApp();
  const { user: neynarUser } = useNeynarUser(context || undefined);
  const { address: walletAddress } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const farcasterUsername = getNeynarUsername(neynarUser) || '';

  // ============================================
  // STATE
  // ============================================
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [votingChallenges, setVotingChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [processingBet, setProcessingBet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ============================================
  // CATEGORY ICONS
  // ============================================
  const categoryIcons: Record<string, string> = {
    sports: '⚽',
    crypto: '₿',
    entertainment: '🎬',
    'social-media': '📱',
    tech: '💻',
    politics: '🏛️',
    weather: '🌤️',
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active challenges
      const activeResponse = await fetch(`${API_BASE_URL}/api/live_market`);
      const activeData = await activeResponse.json();

      // Fetch voting challenges
      const votingResponse = await fetch(`${API_BASE_URL}/api/voting_challenges`);
      const votingData = await votingResponse.json();

      if (activeData.success) {
        const formattedActive = activeData.data.map((c: any) => ({
          id: c.id || c.Id,
          title: c.title,
          category: c.category,
          description: c.description || c.challengeDetails,
          winCondition: c.winCondition,
          creator: c.farcasterUsername || c.creator,
          totalStaked: c.stakePool?.total || c.totalStaked || 0,
          yesPercentage: c.stakePool ? 
            Math.round((c.stakePool.yes / c.stakePool.total) * 100) : 
            (c.yesPercentage || 50),
          noPercentage: c.stakePool ? 
            Math.round((c.stakePool.no / c.stakePool.total) * 100) : 
            (c.noPercentage || 50),
          participants: c.participants || 0,
          status: 'active' as ChallengeStatus,
          timeRemaining: c.timeRemaining,
          banner: categoryIcons[c.category] || '🎯',
          stakePool: c.stakePool,
        }));
        setActiveChallenges(formattedActive);
      }

      if (votingData.success) {
        const formattedVoting = votingData.data.map((c: any) => ({
          id: c.id || c.Id,
          title: c.title,
          category: c.category,
          description: c.description || c.challengeDetails,
          winCondition: c.winCondition,
          creator: c.farcasterUsername || c.creator,
          totalStaked: c.stakePool?.total || c.totalStaked || 0,
          yesPercentage: c.votes?.yesPercentage || 50,
          noPercentage: c.votes ? (100 - c.votes.yesPercentage) : 50,
          participants: c.votes?.total || 0,
          status: 'voting' as ChallengeStatus,
          votingTimeRemaining: c.votingTimeRemaining,
          banner: categoryIcons[c.category] || '🗳️',
          stakePool: c.stakePool,
          votes: c.votes,
        }));
        setVotingChallenges(formattedVoting);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh every 30 seconds
  useEffect(() => {
    fetchChallenges();
    const interval = setInterval(fetchChallenges, 30000);
    return () => clearInterval(interval);
  }, []);

  // ============================================
  // HANDLE BET/VOTE
  // ============================================
  const handlePlaceBet = async (side: 'yes' | 'no', amount: string) => {
    if (!selectedChallenge || !walletAddress || !publicClient || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    setProcessingBet(true);
    setError(null);

    try {
      const stakeAmount = parseFloat(amount);
      const isFor = side === 'yes';

      if (selectedChallenge.status === 'active') {
        // ACTIVE CHALLENGE - Use smart contract stake
        await handleStake(selectedChallenge.id, isFor, stakeAmount);
      } else if (selectedChallenge.status === 'voting') {
        // VOTING CHALLENGE - Use smart contract vote
        await handleVote(selectedChallenge.id, isFor);
        
        // Also update API
        await submitVoteToAPI(selectedChallenge.id, side, stakeAmount);
      }

      // Refresh data
      await fetchChallenges();
      setSelectedChallenge(null);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setProcessingBet(false);
    }
  };

  // Stake on active challenge
  const handleStake = async (challengeId: number | string, isFor: boolean, amount: number) => {
    if (!walletAddress || !publicClient || !walletClient) return;

    const stakeAmountWei = formatUSDCAmount(amount);

    // Check balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    if (balance < stakeAmountWei) {
      throw new Error(`Insufficient USDC. Need ${amount} USDC`);
    }

    // Check allowance
    const currentAllowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [walletAddress, CONTRACT_ADDRESS],
    });

    // Approve if needed
    if (currentAllowance < stakeAmountWei) {
      const approveHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, stakeAmountWei],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // Stake
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'stake',
      args: [BigInt(challengeId), isFor, stakeAmountWei],
    });

    await publicClient.waitForTransactionReceipt({ hash });
  };

  // Vote on voting challenge
  const handleVote = async (challengeId: number | string, voteFor: boolean) => {
    if (!walletAddress || !walletClient || !publicClient) return;

    // Check if user can vote
    const canVote = await publicClient.readContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'canVote',
      args: [BigInt(challengeId), walletAddress],
    });

    if (!canVote) {
      throw new Error('You are not eligible to vote on this challenge');
    }

    // Cast vote
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'vote',
      args: [BigInt(challengeId), voteFor],
    });

    await publicClient.waitForTransactionReceipt({ hash });
  };

  // Submit vote to API
  const submitVoteToAPI = async (challengeId: number | string, vote: 'yes' | 'no', stakeAmount: number) => {
    const response = await fetch(`${API_BASE_URL}/api/challenge_stake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        challengeId: typeof challengeId === 'string' ? parseInt(challengeId) : challengeId,
        farcasterUsername,
        vote,
        stakeAmount,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record vote');
    }

    return response.json();
  };

  // ============================================
  // MANUAL REFRESH
  // ============================================
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChallenges();
    setTimeout(() => setRefreshing(false), 500);
  };

  // ============================================
  // FILTER CHALLENGES
  // ============================================
  const displayedChallenges = (() => {
    if (filter === 'active') return activeChallenges;
    if (filter === 'voting') return votingChallenges;
    return [...activeChallenges, ...votingChallenges];
  })();

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-hidden flex flex-col pb-20">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
            <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
              Live Market
            </span>
          </h1>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-black/40 border border-gray-700 text-white active:scale-95 transition-transform disabled:opacity-50"
          >
            <svg 
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All', icon: '🌟' },
            { id: 'active', label: 'Active', icon: '🔥' },
            { id: 'voting', label: 'Voting', icon: '🗳️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition-all duration-300 ${
                filter === tab.id
                  ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50'
                  : 'bg-black/40 border border-gray-700 text-gray-400'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mb-3 animate-slideUp">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 flex items-center justify-between">
            <p className="text-white text-sm">❌ {error}</p>
            <button onClick={() => setError(null)} className="text-white opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          // Loading State
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-[#7C3AED] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400 font-medium">Loading challenges...</p>
          </div>
        ) : displayedChallenges.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
            <p className="text-gray-400">
              {filter === 'active' ? 'No active challenges at the moment' :
               filter === 'voting' ? 'No challenges in voting period' :
               'Be the first to create a challenge!'}
            </p>
          </div>
        ) : (
          // Challenges Grid
          <div className="space-y-3">
            {displayedChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClick={() => setSelectedChallenge(challenge)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bet Modal */}
      {selectedChallenge && (
        <BetModal
          challenge={{
            id: typeof selectedChallenge.id === 'string' ? parseInt(selectedChallenge.id) : selectedChallenge.id,
            title: selectedChallenge.title,
            banner: selectedChallenge.banner || '🎯',
            category: selectedChallenge.category,
            creator: selectedChallenge.creator || 'Unknown',
            totalStaked: selectedChallenge.totalStaked,
            yesPercentage: selectedChallenge.yesPercentage,
            noPercentage: selectedChallenge.noPercentage,
            participants: selectedChallenge.participants,
          }}
          onClose={() => setSelectedChallenge(null)}
          onPlaceBet={handlePlaceBet}
        />
      )}
    </div>
  );
}

// ============================================
// CHALLENGE CARD COMPONENT
// ============================================

interface ChallengeCardProps {
  challenge: Challenge;
  onClick: () => void;
}

function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const isVoting = challenge.status === 'voting';
  const timeDisplay = isVoting ? challenge.votingTimeRemaining : challenge.timeRemaining;

  return (
    <div
      onClick={onClick}
      className="relative bg-gradient-to-br from-[#1a0b2e]/80 to-[#0f0520]/80 backdrop-blur-md border-2 border-purple-500/30 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:border-purple-500/60 hover:scale-[1.02] active:scale-[0.98]"
      style={{
        boxShadow: '0 4px 20px rgba(124, 58, 237, 0.2)',
      }}
    >
      {/* Status Badge */}
      <div className="absolute -top-2 -right-2 z-10">
        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
          isVoting 
            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/50' 
            : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50'
        }`}>
          {isVoting ? '🗳️ VOTING' : '🔥 ACTIVE'}
        </div>
      </div>

      {/* Challenge Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-4xl flex-shrink-0">{challenge.banner}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black text-white mb-1 leading-tight truncate">
            {challenge.title}
          </h3>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded-full text-purple-300 font-bold">
              {challenge.category}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 font-semibold">{challenge.participants} participants</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total Pool */}
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">Total Pool</p>
          <p className="text-xl font-black text-white">${challenge.totalStaked}</p>
        </div>

        {/* Time Remaining */}
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">
            {isVoting ? 'Voting Ends' : 'Time Left'}
          </p>
          <p className="text-sm font-bold text-white truncate">
            {timeDisplay?.humanReadable || 'N/A'}
          </p>
        </div>
      </div>

      {/* Odds Bar */}
      <div className="relative h-8 bg-black/40 rounded-lg overflow-hidden mb-2">
        <div 
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
          style={{ width: `${challenge.yesPercentage}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-black">
          <span className="text-white drop-shadow-lg">YES {challenge.yesPercentage}%</span>
          <span className="text-white drop-shadow-lg">NO {challenge.noPercentage}%</span>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-black text-sm uppercase tracking-wider transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          boxShadow: '0 4px 15px rgba(124, 58, 237, 0.5)',
        }}
      >
        {isVoting ? '🗳️ Cast Vote' : '💰 Place Stake'}
      </button>
    </div>
  );
}