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

type ChallengeStatus = 'active' | 'voting' | 'completed' | 'pending' | 'cancelled';
type FilterType = 'all' | 'active' | 'voting';
type CategoryType = 'all' | 'sports' | 'crypto' | 'entertainment' | 'social network' | 'tech' | 'politics' | 'weather';

interface Challenge {
  id: number | string;
  title: string;
  category: string;
  challengeDetails?: string;
  description?: string;
  winCondition: string;
  creator: string;
  farcasterUsername?: string;
  currentStake: number;
  totalStaked?: number;
  yesVotes: number;
  noVotes: number;
  totalVotes: number;
  yesPercentage: number;
  noPercentage?: number;
  participants?: number;
  status: ChallengeStatus;
  isActive: boolean;
  timeRemaining?: {
    humanReadable: string;
    expired: boolean;
    days?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
  startDateTime?: string;
  endDateTime?: string;
  voteEndDateTime?: string;
  socialPlatform?: string;
  stakeAmount?: number;
  banner?: string;
}

interface MarketStats {
  totalChallenges: number;
  activeChallenges: number;
  totalStaked: number;
  categoriesCount: Record<string, number>;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
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
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [category, setCategory] = useState<CategoryType>('all');
  const [page, setPage] = useState(1);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [processingBet, setProcessingBet] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  // ============================================
  // CATEGORY ICONS
  // ============================================
  const categoryIcons: Record<string, string> = {
    all: '🌟',
    sports: '⚽',
    crypto: '₿',
    entertainment: '🎬',
    'social network': '📱',
    tech: '💻',
    politics: '🏛️',
    weather: '🌤️',
  };

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchChallenges = async (pageNum: number = 1, statusFilter?: string) => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      // Add username for personalization
      if (farcasterUsername) {
        params.append('farcasterUsername', farcasterUsername);
      }

      // Add category filter
      if (category !== 'all') {
        params.append('category', category);
      }

      // Add status filter
      if (statusFilter) {
        params.append('status', statusFilter);
      } else if (filter === 'active') {
        params.append('status', 'active');
      } else if (filter === 'voting') {
        params.append('status', 'voting');
      }

      const response = await fetch(`${API_BASE_URL}/api/live_market?${params}`);
      const data = await response.json();

      if (data.success) {
        // Format challenges
        const formattedChallenges = data.data.map((c: any) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          challengeDetails: c.challengeDetails,
          description: c.challengeDetails,
          winCondition: c.winCondition,
          creator: c.farcasterUsername,
          farcasterUsername: c.farcasterUsername,
          currentStake: c.currentStake || 0,
          totalStaked: c.currentStake || 0,
          yesVotes: c.yesVotes || 0,
          noVotes: c.noVotes || 0,
          totalVotes: c.totalVotes || 0,
          yesPercentage: c.yesPercentage || 50,
          noPercentage: 100 - (c.yesPercentage || 50),
          participants: c.totalVotes || 0,
          status: c.status,
          isActive: c.isActive,
          timeRemaining: c.timeRemaining,
          banner: categoryIcons[c.category] || '🎯',
          startDateTime: c.startDateTime,
          endDateTime: c.endDateTime,
          voteEndDateTime: c.voteEndDateTime,
          socialPlatform: c.socialPlatform,
          stakeAmount: c.stakeAmount,
        }));

        setChallenges(formattedChallenges);
        
        // Set pagination
        if (data.pagination) {
          setPagination(data.pagination);
        }

        // Set market stats
        if (data.marketStats) {
          setMarketStats(data.marketStats);
        }
      } else {
        setError(data.message || 'Failed to fetch challenges');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch challenges');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and refresh every 30 seconds
  useEffect(() => {
    fetchChallenges(page);
    const interval = setInterval(() => fetchChallenges(page), 30000);
    return () => clearInterval(interval);
  }, [page, filter, category]);

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
      const challengeId = typeof selectedChallenge.id === 'string' 
        ? parseInt(selectedChallenge.id) 
        : selectedChallenge.id;

      // Determine if this is active staking or voting
      const isVoting = selectedChallenge.status === 'voting' || 
                       (selectedChallenge.timeRemaining?.expired && !selectedChallenge.isActive);

      if (!isVoting) {
        // ACTIVE CHALLENGE - Use smart contract stake
        await handleStake(challengeId, isFor, stakeAmount);
      } else {
        // VOTING CHALLENGE - Use smart contract vote + API
        await handleVote(challengeId, isFor, stakeAmount);
      }

      // Submit vote/stake to API
      await submitVoteToAPI(challengeId, side, stakeAmount);

      // Refresh data
      await fetchChallenges(page);
      setSelectedChallenge(null);
    } catch (err: any) {
      setError(err.message || 'Transaction failed');
    } finally {
      setProcessingBet(false);
    }
  };

  // Stake on active challenge
  const handleStake = async (challengeId: number, isFor: boolean, amount: number) => {
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
  const handleVote = async (challengeId: number, voteFor: boolean, stakeAmount: number) => {
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

  // Submit vote to NEW API endpoint
  const submitVoteToAPI = async (challengeId: number, vote: 'yes' | 'no', stakeAmount: number) => {
    const response = await fetch(`${API_BASE_URL}/api/live_market`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        farcasterUsername,
        challengeId,
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
    await fetchChallenges(page);
    setTimeout(() => setRefreshing(false), 500);
  };

  // ============================================
  // PAGINATION
  // ============================================
  const handlePrevPage = () => {
    if (pagination?.hasPrev) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination?.hasNext) {
      setPage(page + 1);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-hidden flex flex-col pb-20">
      {/* Header */}
      <div className="flex-shrink-0 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Live Market
              </span>
            </h1>
            {marketStats && (
              <p className="text-xs text-gray-400 mt-1">
                {marketStats.activeChallenges} active • ${marketStats.totalStaked.toLocaleString()} staked
              </p>
            )}
          </div>
          
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
        <div className="flex gap-2 mb-3">
          {[
            { id: 'all', label: 'All', icon: '🌟' },
            { id: 'active', label: 'Active', icon: '🔥' },
            { id: 'voting', label: 'Voting', icon: '🗳️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilter(tab.id as FilterType);
                setPage(1);
              }}
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

        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => setShowCategories(!showCategories)}
            className="w-full flex items-center justify-between bg-black/40 border border-gray-700 rounded-xl px-4 py-2.5 text-white text-sm font-bold"
          >
            <span>
              {categoryIcons[category]} {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
            </span>
            <svg className={`w-4 h-4 transition-transform ${showCategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCategories && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 border border-gray-700 rounded-xl overflow-hidden z-50 backdrop-blur-lg">
              {(Object.keys(categoryIcons) as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setShowCategories(false);
                    setPage(1);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
                    category === cat
                      ? 'bg-[#7C3AED] text-white'
                      : 'text-gray-400 hover:bg-gray-800'
                  }`}
                >
                  <span className="text-xl">{categoryIcons[cat]}</span>
                  <span>{cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                  {marketStats?.categoriesCount[cat] && (
                    <span className="ml-auto text-xs opacity-70">
                      {marketStats.categoriesCount[cat]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
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
        ) : challenges.length === 0 ? (
          // Empty State
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Challenges Found</h3>
            <p className="text-gray-400">
              {filter === 'active' ? 'No active challenges at the moment' :
               filter === 'voting' ? 'No challenges in voting period' :
               category !== 'all' ? `No challenges in ${category} category` :
               'Be the first to create a challenge!'}
            </p>
          </div>
        ) : (
          // Challenges Grid
          <>
            <div className="space-y-3 mb-4">
              {challenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onClick={() => setSelectedChallenge(challenge)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-black/40 border border-gray-700 rounded-xl p-4">
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>

                <div className="text-white text-sm font-bold">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#7C3AED] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
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
            creator: selectedChallenge.creator || selectedChallenge.farcasterUsername || 'Unknown',
            totalStaked: selectedChallenge.currentStake || selectedChallenge.totalStaked || 0,
            yesPercentage: selectedChallenge.yesPercentage,
            noPercentage: selectedChallenge.noPercentage || (100 - selectedChallenge.yesPercentage),
            participants: selectedChallenge.totalVotes || selectedChallenge.participants || 0,
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
  const isVoting = challenge.status === 'voting' || 
                   (challenge.timeRemaining?.expired && !challenge.isActive);
  const timeDisplay = challenge.timeRemaining;

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
            : challenge.isActive
            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/50'
            : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/50'
        }`}>
          {isVoting ? '🗳️ VOTING' : challenge.isActive ? '🔥 ACTIVE' : '⏸️ PENDING'}
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
            <span className="text-gray-400 font-semibold">{challenge.totalVotes || 0} votes</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Total Pool */}
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">Total Staked</p>
          <p className="text-xl font-black text-white">${challenge.currentStake || 0}</p>
        </div>

        {/* Time Remaining */}
        <div className="bg-black/40 border border-purple-500/30 rounded-lg p-2.5">
          <p className="text-xs text-purple-300/70 mb-0.5">
            {isVoting ? 'Voting Status' : 'Time Left'}
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
          <span className="text-white drop-shadow-lg">NO {100 - challenge.yesPercentage}%</span>
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