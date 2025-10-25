// components/ui/tabs/CreateTab.tsx
"use client";
import { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { TimePicker } from '../TimePicker';
import { useMiniApp } from '@neynar/react';
import { useNeynarUser } from '~/hooks/useNeynarUser';
import { getNeynarUsername, getNeynarWalletAddress, getNeynarFid, getNeynarPfpUrl } from '~/lib/neynarUtils';
import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { type Address } from 'viem';
import { signPermit, formatUSDCAmount, supportsPermit } from '~/utils/permit-wagmi';

// ============================================
// CONFIGURATION
// ============================================

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x4b637CBe4B1A94CdcDE05c8BACC8C74813273CDf') as Address;
const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://stakely-backend.onrender.com';

// ============================================
// TYPES
// ============================================

interface Category {
  id: string;
  label: string;
  icon: string;
}

type CreateStep = 
  | 'idle'
  | 'checking_permit'
  | 'signing_permit'
  | 'approving'
  | 'creating'
  | 'waiting_confirmation'
  | 'saving_to_api'
  | 'success'
  | 'error';

// ============================================
// CONSTANTS
// ============================================

const STEP_MESSAGES: Record<CreateStep, string> = {
  idle: '',
  checking_permit: '🔍 Checking permit support...',
  signing_permit: '📝 Sign in your wallet...',
  approving: '⏳ Approving USDC (1/2)...',
  creating: '⚡ Creating on blockchain...',
  waiting_confirmation: '⏳ Confirming transaction...',
  saving_to_api: '💾 Saving to database...',
  success: '✅ Challenge created!',
  error: '❌ Something went wrong',
};

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
    name: 'createChallengeWithPermit',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'votingDuration', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
      { name: 'permitDeadline', type: 'uint256' },
      { name: 'v', type: 'uint8' },
      { name: 'r', type: 'bytes32' },
      { name: 's', type: 'bytes32' },
    ],
    outputs: [],
  },
  {
    name: 'createChallenge',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'description', type: 'string' },
      { name: 'deadline', type: 'uint256' },
      { name: 'votingDuration', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// ============================================
// HELPER FUNCTIONS
// ============================================

// Parse date/time to Unix timestamp
function parseDateTime(date: string, time: { hours: string; minutes: string; seconds: string }): number {
  const [year, month, day] = date.split('-').map(Number);
  const hours = parseInt(time.hours);
  const minutes = parseInt(time.minutes);
  const seconds = parseInt(time.seconds);
  return Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000);
}

// Format Unix timestamp for backend (DD/MM/YYYY)
function formatDateForBackend(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Format time for backend (HH:MM:SS)
function formatTimeForBackend(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// ============================================
// MAIN COMPONENT
// ============================================

// Component props (optional - can also use hooks)
interface CreateTabProps {
  neynarUser?: any;
  walletAddress?: Address;
  isWalletConnected?: boolean;
  onSuccess?: () => void; // Callback to navigate to market tab
}

export function CreateTab({ 
  neynarUser: neynarUserProp, 
  walletAddress: walletAddressProp, 
  isWalletConnected: isWalletConnectedProp,
  onSuccess
}: CreateTabProps = {}) {
  // ============================================
  // HOOKS
  // ============================================
  const { context } = useMiniApp();
  const { user: neynarUserHook } = useNeynarUser(context || undefined);
  const { address: walletAddressHook } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  // Use props if provided, otherwise fall back to hooks
  const neynarUser = neynarUserProp ?? neynarUserHook;
  const walletAddress = walletAddressProp ?? walletAddressHook;
  
  const farcasterUsername = getNeynarUsername(neynarUser) || '';
  const farcasterFid = getNeynarFid(neynarUser);
  const farcasterPfpUrl = getNeynarPfpUrl(neynarUser);
  
  // ============================================
  // STATE
  // ============================================
  const [formStep, setFormStep] = useState(1);
  
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

  // Transaction state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CreateStep>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<number | null>(null);

  // Debug console
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(true);

  const addDebugLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️',
    };
    const timestamp = new Date().toLocaleTimeString();
    const log = `${timestamp} ${emoji[type]} ${message}`;
    setDebugLogs(prev => [...prev.slice(-50), log]); // Keep last 50 logs
  };

  // ============================================
  // CALCULATE DURATION
  // ============================================
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

  // ============================================
  // BLOCKCHAIN FUNCTIONS
  // ============================================

  // Create with permit (1 tx - gasless approval!)
  const createWithPermit = async () => {
    if (!walletAddress || !publicClient || !walletClient) {
      throw new Error('Wallet not connected');
    }

    const stakeAmountWei = formatUSDCAmount(stakeAmount);
    const deadlineUnix = parseDateTime(endDate, endTime);
    const votingDurationSeconds = votingDurationHours * 3600;

    // Check balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    if (balance < stakeAmountWei) {
      throw new Error(`Insufficient USDC. Need ${stakeAmount} USDC`);
    }

    // Sign permit (gasless!)
    setStep('signing_permit');
    const permitSig = await signPermit(
      USDC_ADDRESS,
      walletAddress,
      CONTRACT_ADDRESS,
      stakeAmountWei,
      publicClient,
      walletClient
    );

    // Create challenge with permit (single transaction!)
    setStep('creating');
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createChallengeWithPermit',
      args: [
        description || challengeTitle,
        BigInt(deadlineUnix),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
        BigInt(permitSig.deadline),
        permitSig.v,
        permitSig.r,
        permitSig.s,
      ],
    });

    setTxHash(hash);
    setStep('waiting_confirmation');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const challengeIdFromLogs = Number(receipt.logs[0]?.topics[1] || '0');
    setChallengeId(challengeIdFromLogs);

    return { hash, challengeId: challengeIdFromLogs };
  };

  // Create with approval (2 txs - fallback)
  const createWithApproval = async () => {
    if (!walletAddress || !publicClient || !walletClient) {
      throw new Error('Wallet not connected');
    }

    addDebugLog('Starting approval flow...', 'info');

    const stakeAmountWei = formatUSDCAmount(stakeAmount);
    const deadlineUnix = parseDateTime(endDate, endTime);
    const votingDurationSeconds = votingDurationHours * 3600;

    addDebugLog(`Stake: ${stakeAmount} USDC = ${stakeAmountWei.toString()} wei`, 'info');
    addDebugLog(`Deadline: ${deadlineUnix} (${new Date(deadlineUnix * 1000).toISOString()})`, 'info');

    // Check balance
    const balance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    addDebugLog(`Balance: ${Number(balance) / 1_000_000} USDC`, 'success');

    if (balance < stakeAmountWei) {
      addDebugLog(`Insufficient USDC! Need ${stakeAmount}, have ${Number(balance) / 1_000_000}`, 'error');
      throw new Error(`Insufficient USDC. Need ${stakeAmount} USDC`);
    }

    // Check allowance
    const currentAllowance = await publicClient.readContract({
      address: USDC_ADDRESS,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [walletAddress, CONTRACT_ADDRESS],
    });

    addDebugLog(`Allowance: ${currentAllowance.toString()} wei`, 'info');

    // Approve if needed
    if (currentAllowance < stakeAmountWei) {
      addDebugLog('Approval needed, requesting...', 'warning');
      setStep('approving');
      const approveHash = await walletClient.writeContract({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, stakeAmountWei],
      });
      addDebugLog(`Approval tx: ${approveHash}`, 'success');
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      addDebugLog('Approval confirmed!', 'success');
    } else {
      addDebugLog('Already approved, skipping', 'success');
    }

    // Create challenge
    addDebugLog('Creating challenge...', 'info');
    setStep('creating');
    
    const hash = await walletClient.writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createChallenge',
      args: [
        description || challengeTitle,
        BigInt(deadlineUnix),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
      ],
    });

    addDebugLog(`Create tx: ${hash}`, 'success');
    setTxHash(hash);
    setStep('waiting_confirmation');

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    addDebugLog(`Confirmed! Block: ${receipt.blockNumber}`, 'success');
    
    // Parse challenge ID
    let challengeIdFromLogs = 0;
    
    if (receipt.logs && receipt.logs.length > 0) {
      addDebugLog(`Found ${receipt.logs.length} logs`, 'info');
      
      if (receipt.logs[0]?.topics[1]) {
        challengeIdFromLogs = Number(receipt.logs[0].topics[1]);
        addDebugLog(`Challenge ID from logs: ${challengeIdFromLogs}`, 'success');
      }
      
      for (const log of receipt.logs) {
        if (log.topics.length > 1) {
          const possibleId = Number(log.topics[1]);
          if (possibleId > 0 && possibleId < 1000000) {
            challengeIdFromLogs = possibleId;
            addDebugLog(`Found valid ID: ${challengeIdFromLogs}`, 'success');
            break;
          }
        }
      }
    }

    if (challengeIdFromLogs === 0) {
      addDebugLog('Could not parse challenge ID!', 'error');
      throw new Error('Failed to get challenge ID from transaction');
    }

    addDebugLog(`Final Challenge ID: ${challengeIdFromLogs}`, 'success');
    setChallengeId(challengeIdFromLogs);

    return { hash, challengeId: challengeIdFromLogs };
  };

  // Save to backend
  const saveToBackend = async (onchainData: { hash: string; challengeId: number }) => {
    setStep('saving_to_api');

    const startDateTimeUnix = parseDateTime(startDate, startTime);
    const endDateTimeUnix = parseDateTime(endDate, endTime);
    const votingDeadlineUnix = endDateTimeUnix + votingDurationHours * 3600;

    addDebugLog(`Start: ${formatDateForBackend(startDateTimeUnix)} ${formatTimeForBackend(startDateTimeUnix)}`, 'info');
    addDebugLog(`End: ${formatDateForBackend(endDateTimeUnix)} ${formatTimeForBackend(endDateTimeUnix)}`, 'info');

    const payload = {
      Id: onchainData.challengeId,
      farcasterUsername,
      title: challengeTitle,
      category: selectedCategory!,
      description: description || challengeTitle,
      winCondition,
      socialPlatform: selectedPlatform || 'farcaster',
      startDate: formatDateForBackend(startDateTimeUnix),
      startTime: formatTimeForBackend(startDateTimeUnix),
      endDate: formatDateForBackend(endDateTimeUnix),
      endTime: formatTimeForBackend(endDateTimeUnix),
      stakeAmount,
    };

    addDebugLog(`Sending to API: ${API_BASE_URL}/api/create_challenge`, 'info');

    try {
      const response = await fetch(`${API_BASE_URL}/api/create_challenge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      addDebugLog(`API Response: ${response.status} ${response.statusText}`, response.ok ? 'success' : 'error');

      const responseText = await response.text();
      
      if (!response.ok) {
        addDebugLog(`API Error: ${responseText}`, 'error');
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText || 'Unknown error' };
        }
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const result = JSON.parse(responseText);
      addDebugLog('API Success!', 'success');
      return result;
    } catch (fetchError: any) {
      addDebugLog(`Fetch Error: ${fetchError.message}`, 'error');
      throw fetchError;
    }
  };

  // ============================================
  // SUBMIT HANDLER
  // ============================================
  const handleSubmit = async () => {
    addDebugLog('=== STARTING CHALLENGE CREATION ===', 'info');

    // Validation checks
    addDebugLog(`Wallet: ${walletAddress ? '✅' : '❌'}`, walletAddress ? 'success' : 'error');
    addDebugLog(`Neynar: ${neynarUser ? '✅' : '❌'}`, neynarUser ? 'success' : 'error');
    addDebugLog(`Title: ${challengeTitle || '❌'}`, challengeTitle ? 'success' : 'error');
    addDebugLog(`Category: ${selectedCategory || '❌'}`, selectedCategory ? 'success' : 'error');
    addDebugLog(`Win condition: ${winCondition ? '✅' : '❌'}`, winCondition ? 'success' : 'error');
    addDebugLog(`Dates: ${startDate && endDate ? '✅' : '❌'}`, startDate && endDate ? 'success' : 'error');
    addDebugLog(`Stake: ${stakeAmount || '❌'}`, stakeAmount ? 'success' : 'error');

    if (!walletAddress) {
      setError('Please connect your wallet');
      addDebugLog('Validation failed: No wallet', 'error');
      return;
    }

    if (!neynarUser) {
      setError('Farcaster account not found');
      addDebugLog('Validation failed: No Neynar user', 'error');
      return;
    }

    if (!challengeTitle || !selectedCategory || !winCondition || !startDate || !endDate || !stakeAmount) {
      setError('Please fill in all required fields');
      addDebugLog('Validation failed: Missing fields', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('checking_permit');
    setTxHash(null);
    setChallengeId(null);

    try {
      addDebugLog(`User: @${farcasterUsername} (FID: ${farcasterFid})`, 'info');
      addDebugLog('Using 2-transaction approval flow', 'info');
      
      const result = await createWithApproval();
      addDebugLog('Blockchain creation complete!', 'success');

      await saveToBackend(result);

      setStep('success');
      addDebugLog('=== CHALLENGE CREATED SUCCESSFULLY ===', 'success');

      // Wait for user to see success message, then navigate
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(); // Navigate to market tab
        } else {
          resetForm();
          setDebugLogs([]);
        }
      }, 2500);

    } catch (err: any) {
      addDebugLog(`ERROR: ${err.message}`, 'error');
      setError(err.message || 'Failed to create challenge');
      setStep('error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FORM NAVIGATION
  // ============================================
  const canGoNext = () => {
    switch(formStep) {
      case 1: return challengeTitle && selectedCategory;
      case 2: return winCondition;
      case 3: return startDate && endDate;
      case 4: return stakeAmount > 0;
      default: return false;
    }
  };

  const handleNext = async () => {
    if (canGoNext()) {
      if (formStep < 4) {
        setFormStep(formStep + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const resetForm = () => {
    setFormStep(1);
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
    setVotingDurationHours(24);
    setStep('idle');
    setTxHash(null);
    setChallengeId(null);
    setError(null);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0118] via-[#1a0f3a] to-[#0a0118] overflow-hidden flex flex-col pb-20">
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div 
          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#a855f7] transition-all duration-300"
          style={{ width: `${(formStep / 4) * 100}%` }}
        />
      </div>

      {/* Header - Fixed */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {formStep > 1 ? (
            <button
              onClick={() => setFormStep(formStep - 1)}
              disabled={loading}
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
                Step {formStep} of 4
              </span>
            </div>
          </div>
          
          <button
            onClick={() => walletAddress && alert(`Connected: @${farcasterUsername}\n${walletAddress}`)}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            @{farcasterUsername || '...'}
          </button>
        </div>
      </div>

      {/* Status Banners */}
      {loading && (
        <div className="px-4 pb-2">
          <div className="bg-[#7C3AED]/20 border border-[#7C3AED] rounded-xl p-3">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm font-medium">
                {STEP_MESSAGES[step]}
              </span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 pb-2">
          <div className="bg-red-500/20 border border-red-500 rounded-xl p-3">
            <p className="text-white text-sm">❌ {error}</p>
          </div>
        </div>
      )}

      {step === 'success' && txHash && (
        <div className="px-4 pb-2 animate-slideUp">
          <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-2 border-green-500 rounded-xl p-4 shadow-lg shadow-green-500/30">
            <div className="flex items-start gap-3">
              <div className="text-4xl animate-bounce">🎉</div>
              <div className="flex-1">
                <p className="text-green-400 font-black text-lg mb-1">Challenge Created!</p>
                <div className="text-sm text-white/90 space-y-1">
                  <p>Challenge ID: <span className="font-bold text-white">#{challengeId}</span></p>
                  <a
                    href={`https://basescan.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#7C3AED] hover:text-[#a855f7] hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    View on BaseScan →
                  </a>
                </div>
                <p className="text-gray-300 text-xs mt-2">
                  🚀 Redirecting to market...
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Step 1: Basic Info */}
        {formStep === 1 && (
          <div className="space-y-4 animate-slideUp">
            <h2 className="text-3xl font-black text-center uppercase tracking-tight" style={{ fontFamily: '"Bebas Neue", sans-serif' }}>
              <span className="bg-gradient-to-r from-[#7C3AED] to-[#a855f7] bg-clip-text text-transparent">
                Basic Info
              </span>
            </h2>

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
        {formStep === 2 && (
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
        {formStep === 3 && (
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
        {formStep === 4 && (
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
              <p className="text-white font-black text-5xl">${stakeAmount.toFixed(2)} USDC</p>
            </div>
          </div>
        )}
      </div>

      {/* Debug Console */}
      {showDebug && debugLogs.length > 0 && (
        <div className="fixed bottom-24 left-2 right-2 max-h-64 bg-black/95 border border-[#7C3AED] rounded-xl overflow-hidden z-50">
          <div className="flex items-center justify-between p-2 bg-[#7C3AED]/20 border-b border-[#7C3AED]">
            <span className="text-white text-xs font-bold">🔍 Debug Console</span>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>
          <div className="overflow-y-auto max-h-56 p-2 space-y-1">
            {debugLogs.map((log, i) => (
              <div
                key={i}
                className={`text-xs font-mono ${
                  log.includes('❌') ? 'text-red-400' :
                  log.includes('✅') ? 'text-green-400' :
                  log.includes('⚠️') ? 'text-yellow-400' :
                  'text-gray-300'
                }`}
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Toggle (when hidden) */}
      {!showDebug && debugLogs.length > 0 && (
        <button
          onClick={() => setShowDebug(true)}
          className="fixed bottom-24 right-4 bg-[#7C3AED] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg z-50"
        >
          🔍
        </button>
      )}

      {/* Bottom Navigation - Fixed */}
      <div className="fixed bottom-20 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-[#0a0118] via-[#0a0118] to-transparent z-40">
        <button
          onClick={handleNext}
          disabled={!canGoNext() || loading}
          className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider transition-all duration-300 ${
            canGoNext() && !loading
              ? 'bg-gradient-to-r from-[#7C3AED] to-[#a855f7] text-white shadow-lg shadow-purple-500/50 active:scale-95'
              : 'bg-gray-800 text-gray-500 opacity-50 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {STEP_MESSAGES[step]}
            </span>
          ) : formStep < 4 ? (
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