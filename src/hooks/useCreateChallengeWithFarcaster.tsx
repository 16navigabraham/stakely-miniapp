// hooks/useCreateChallengeWithFarcaster.ts
import { useState, useCallback } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { type Address, type Hash, parseUnits } from 'viem';
import { signPermit } from '~/utils/permit-wagmi';
import { useFarcasterAuth } from '~/hooks/useFarcasterAuth';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateChallengeFormData {
  title: string;
  category: string;
  description: string;
  winCondition: string;
  startDate: string; // DD/MM/YYYY
  startTime: string; // HH:MM:SS
  endDate: string;   // DD/MM/YYYY
  endTime: string;   // HH:MM:SS
  stakeAmount: number; // In USDC (not wei)
  votingDurationHours: number;
  banner?: {
    filename: string;
    contentType: string;
    data: string; // base64
  };
}

export interface OnchainChallengeData {
  challengeId: number;
  txHash: Hash;
  blockNumber: bigint;
  timestamp: number;
}

export interface BackendChallengeData extends CreateChallengeFormData {
  Id: string;
  onchainChallengeId: number;
  txHash: string;
  votingDeadline: string;
  farcasterFid: number;
  farcasterUsername: string;
  farcasterPfpUrl: string;
  walletAddress: string;
}

export type CreateChallengeStep = 
  | 'idle'
  | 'checking_farcaster'
  | 'checking_permit'
  | 'signing_permit'
  | 'approving'
  | 'creating'
  | 'waiting_confirmation'
  | 'saving_to_api'
  | 'success'
  | 'error';

export interface UseCreateChallengeWithFarcasterResult {
  createChallenge: (data: CreateChallengeFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
  step: CreateChallengeStep;
  onchainData: OnchainChallengeData | null;
  apiResponse: any | null;
  supportsPermit: boolean | null;
  isConnected: boolean;
  address: Address | undefined;
  
  // Farcaster status
  farcasterUser: any;
  isFullyAuthenticated: boolean;
  farcasterError: string | null;
  
  reset: () => void;
}

// ============================================
// CONTRACT ABIs
// ============================================

const GRINDARENA_ABI = [
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
  {
    name: 'ChallengeCreated',
    type: 'event',
    inputs: [
      { name: 'challengeId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'creatorWager', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
      { name: 'votingDeadline', type: 'uint256', indexed: false },
    ],
  },
] as const;

const USDC_ABI = [
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
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'DOMAIN_SEPARATOR',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
  },
] as const;

// ============================================
// MAIN HOOK
// ============================================

export function useCreateChallengeWithFarcaster(
  contractAddress: Address,
  usdcAddress: Address,
  apiBaseUrl: string,
  neynarApiKey: string
): UseCreateChallengeWithFarcasterResult {
  // Wagmi hooks
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  // Farcaster authentication
  const {
    farcasterUser,
    isFullyAuthenticated,
    farcasterError,
    authenticateWithFarcaster,
  } = useFarcasterAuth(neynarApiKey, true);

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CreateChallengeStep>('idle');
  const [onchainData, setOnchainData] = useState<OnchainChallengeData | null>(null);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [supportsPermit, setSupportsPermit] = useState<boolean | null>(null);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const parseDateTime = useCallback((date: string, time: string): number => {
    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000);
  }, []);

  const checkBalance = useCallback(async (userAddress: Address, amount: bigint) => {
    if (!publicClient) throw new Error('Public client not available');

    const balance = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    });

    if (balance < amount) {
      throw new Error(
        `Insufficient USDC balance. Required: ${amount / 10n ** 6n}, Have: ${balance / 10n ** 6n}`
      );
    }
  }, [publicClient, usdcAddress]);

  const checkPermitSupport = useCallback(async (): Promise<boolean> => {
    if (!publicClient) return false;

    try {
      await publicClient.readContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'DOMAIN_SEPARATOR',
      });
      setSupportsPermit(true);
      return true;
    } catch {
      setSupportsPermit(false);
      return false;
    }
  }, [publicClient, usdcAddress]);

  const extractChallengeIdFromReceipt = useCallback(async (txHash: Hash): Promise<number> => {
    if (!publicClient) throw new Error('Public client not available');
    
    const receipt = await publicClient.getTransactionReceipt({ hash: txHash });
    
    // Parse logs to find ChallengeCreated event
    for (const log of receipt.logs) {
      if (log.address.toLowerCase() === contractAddress.toLowerCase()) {
        // The challengeId is the first indexed parameter (topics[1])
        const challengeId = BigInt(log.topics[1] || '0');
        return Number(challengeId);
      }
    }
    
    throw new Error('Could not find ChallengeCreated event in transaction receipt');
  }, [publicClient, contractAddress]);

  // ============================================
  // CREATE WITH PERMIT (1 TRANSACTION)
  // ============================================

  const createWithPermit = useCallback(async (
    data: CreateChallengeFormData,
    userAddress: Address
  ): Promise<OnchainChallengeData> => {
    if (!publicClient || !walletClient) throw new Error('Clients not available');
    
    const stakeAmountWei = parseUnits(data.stakeAmount.toString(), 6);
    const deadline = parseDateTime(data.endDate, data.endTime);
    const votingDurationSeconds = data.votingDurationHours * 3600;

    await checkBalance(userAddress, stakeAmountWei);

    setStep('signing_permit');
    console.log('📝 Signing permit...');

    // Sign permit using the utility function
    const permitSig = await signPermit(
      usdcAddress,
      userAddress,
      contractAddress,
      stakeAmountWei,
      publicClient,
      walletClient
    );

    setStep('creating');
    console.log('✨ Creating challenge with permit...');

    // Call contract with permit
    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: GRINDARENA_ABI,
      functionName: 'createChallengeWithPermit',
      args: [
        data.description,
        BigInt(deadline),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
        BigInt(permitSig.deadline),
        permitSig.v,
        permitSig.r,
        permitSig.s,
      ],
    });

    setStep('waiting_confirmation');
    console.log('⏳ Waiting for confirmation... Tx:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const challengeId = await extractChallengeIdFromReceipt(hash);

    console.log('✅ Challenge created! ID:', challengeId);

    return {
      challengeId,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }, [publicClient, walletClient, contractAddress, usdcAddress, parseDateTime, checkBalance, extractChallengeIdFromReceipt]);

  // ============================================
  // CREATE WITH APPROVAL (2 TRANSACTIONS)
  // ============================================

  const createWithApproval = useCallback(async (
    data: CreateChallengeFormData,
    userAddress: Address
  ): Promise<OnchainChallengeData> => {
    if (!publicClient || !walletClient) throw new Error('Clients not available');
    
    const stakeAmountWei = parseUnits(data.stakeAmount.toString(), 6);
    const deadline = parseDateTime(data.endDate, data.endTime);
    const votingDurationSeconds = data.votingDurationHours * 3600;

    await checkBalance(userAddress, stakeAmountWei);

    // Check current allowance
    const currentAllowance = await publicClient.readContract({
      address: usdcAddress,
      abi: USDC_ABI,
      functionName: 'allowance',
      args: [userAddress, contractAddress],
    });

    // Approve if needed
    if (currentAllowance < stakeAmountWei) {
      setStep('approving');
      console.log('📝 Approving USDC...');
      
      const approveHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [contractAddress, stakeAmountWei],
      });
      
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      console.log('✅ USDC approved');
    }

    setStep('creating');
    console.log('✨ Creating challenge...');

    const hash = await walletClient.writeContract({
      address: contractAddress,
      abi: GRINDARENA_ABI,
      functionName: 'createChallenge',
      args: [
        data.description,
        BigInt(deadline),
        BigInt(votingDurationSeconds),
        stakeAmountWei,
      ],
    });

    setStep('waiting_confirmation');
    console.log('⏳ Waiting for confirmation... Tx:', hash);

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    const challengeId = await extractChallengeIdFromReceipt(hash);

    console.log('✅ Challenge created! ID:', challengeId);

    return {
      challengeId,
      txHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }, [publicClient, walletClient, contractAddress, usdcAddress, parseDateTime, checkBalance, extractChallengeIdFromReceipt]);

  // ============================================
  // SAVE TO BACKEND API
  // ============================================

  const saveToBackend = useCallback(async (
    formData: CreateChallengeFormData,
    onchainData: OnchainChallengeData,
    userAddress: Address
  ): Promise<any> => {
    if (!farcasterUser) {
      throw new Error('Farcaster user not authenticated');
    }

    setStep('saving_to_api');
    console.log('💾 Saving to backend API...');

    const endDateTime = parseDateTime(formData.endDate, formData.endTime);
    const votingDeadlineMs = endDateTime * 1000 + formData.votingDurationHours * 3600000;
    const votingDeadline = new Date(votingDeadlineMs).toISOString();

    const backendData: BackendChallengeData = {
      ...formData,
      Id: `${userAddress.toLowerCase()}_challenge${onchainData.challengeId}`,
      onchainChallengeId: onchainData.challengeId,
      txHash: onchainData.txHash,
      votingDeadline,
      walletAddress: userAddress,
      farcasterFid: farcasterUser.fid,
      farcasterUsername: farcasterUser.username,
      farcasterPfpUrl: farcasterUser.pfpUrl,
    };

    const response = await fetch(`${apiBaseUrl}/api/create_challenge`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(backendData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(errorData.message || `Backend API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Saved to backend:', result);
    
    return result;
  }, [apiBaseUrl, parseDateTime, farcasterUser]);

  // ============================================
  // MAIN CREATE CHALLENGE FUNCTION
  // ============================================

  const createChallenge = useCallback(async (data: CreateChallengeFormData) => {
    // Check wallet connection
    if (!isConnected || !address) {
      setError('Please connect your wallet');
      return;
    }

    // Check Farcaster authentication
    setStep('checking_farcaster');
    if (!farcasterUser) {
      console.log('🔄 Authenticating with Farcaster...');
      try {
        await authenticateWithFarcaster();
      } catch (err: any) {
        setError(err.message || 'Failed to authenticate with Farcaster');
        setStep('error');
        return;
      }
    }

    if (!farcasterUser) {
      setError('Farcaster authentication required');
      setStep('error');
      return;
    }

    if (!walletClient) {
      setError('Wallet client not available');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('checking_permit');
    setOnchainData(null);
    setApiResponse(null);

    try {
      console.log('👤 Wallet:', address);
      console.log('🟣 Farcaster:', farcasterUser.username, `(FID: ${farcasterUser.fid})`);

      // Check if permit is supported
      const hasPermit = await checkPermitSupport();
      console.log('🔐 Permit support:', hasPermit ? 'YES' : 'NO');

      let result: OnchainChallengeData;

      // Try permit first (single transaction)
      if (hasPermit) {
        try {
          result = await createWithPermit(data, address);
          console.log('✅ Created with permit (1 transaction)');
        } catch (permitError: any) {
          console.warn('❌ Permit failed:', permitError.message);
          
          // If permit fails, fall back to approval flow
          if (permitError.message.includes('rejected') ||
              permitError.message.includes('User rejected')) {
            console.log('🔄 Falling back to approval flow...');
            result = await createWithApproval(data, address);
            console.log('✅ Created with approval (2 transactions)');
          } else {
            throw permitError;
          }
        }
      } else {
        // No permit support, use approval flow
        result = await createWithApproval(data, address);
        console.log('✅ Created with approval (2 transactions)');
      }

      setOnchainData(result);

      // Save to backend
      const backendResult = await saveToBackend(data, result, address);
      setApiResponse(backendResult);

      setStep('success');
      console.log('🎉 Challenge creation complete!');
      
    } catch (err: any) {
      console.error('❌ Error creating challenge:', err);
      setError(err.message || 'Failed to create challenge');
      setStep('error');
    } finally {
      setLoading(false);
    }
  }, [
    isConnected,
    address,
    farcasterUser,
    walletClient,
    authenticateWithFarcaster,
    checkPermitSupport,
    createWithPermit,
    createWithApproval,
    saveToBackend,
  ]);

  // ============================================
  // RESET FUNCTION
  // ============================================

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setStep('idle');
    setOnchainData(null);
    setApiResponse(null);
    setSupportsPermit(null);
  }, []);

  // ============================================
  // RETURN
  // ============================================

  return {
    createChallenge,
    loading,
    error,
    step,
    onchainData,
    apiResponse,
    supportsPermit,
    isConnected,
    address,
    farcasterUser,
    isFullyAuthenticated,
    farcasterError,
    reset,
  };
}

// ============================================
// STEP DESCRIPTIONS (for UI)
// ============================================

export const STEP_MESSAGES: Record<CreateChallengeStep, string> = {
  idle: '',
  checking_farcaster: '🟣 Checking Farcaster authentication...',
  checking_permit: '🔍 Checking permit support...',
  signing_permit: '📝 Please sign the permit message in your wallet...',
  approving: '⏳ Approving USDC... (Transaction 1/2)',
  creating: '⏳ Creating challenge on blockchain...',
  waiting_confirmation: '⏳ Waiting for transaction confirmation...',
  saving_to_api: '💾 Saving challenge details to database...',
  success: '✅ Challenge created successfully!',
  error: '❌ An error occurred',
};