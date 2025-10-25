// hooks/useCreateChallenge.ts
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { signPermit } from '~/utils/permit';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface CreateChallengeFormData {
  farcasterUsername: string;
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
  banner: {
    filename: string;
    contentType: string;
    data: string; // base64
  };
}

export interface OnchainChallengeData {
  challengeId: number;
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface BackendChallengeData extends CreateChallengeFormData {
  Id: string;
  onchainChallengeId: number;
  txHash: string;
  votingDeadline: string; // ISO string
}

export type CreateChallengeStep = 
  | 'idle'
  | 'checking_permit'
  | 'signing_permit'
  | 'approving'
  | 'creating'
  | 'waiting_confirmation'
  | 'saving_to_api'
  | 'success'
  | 'error';

export interface UseCreateChallengeResult {
  // Main function
  createChallenge: (data: CreateChallengeFormData) => Promise<void>;
  
  // State
  loading: boolean;
  error: string | null;
  step: CreateChallengeStep;
  
  // Results
  onchainData: OnchainChallengeData | null;
  apiResponse: any | null;
  
  // Additional info
  supportsPermit: boolean | null;
  estimatedGas: string | null;
  
  // Reset function
  reset: () => void;
}

// ============================================
// CONTRACT ABI (Only what we need)
// ============================================

const GRINDARENA_ABI = [
  // Permit functions
  'function createChallengeWithPermit(string,uint256,uint256,uint256,uint256,uint8,bytes32,bytes32) external',
  'function stakeWithPermit(uint256,bool,uint256,uint256,uint8,bytes32,bytes32) external',
  
  // Regular functions
  'function createChallenge(string,uint256,uint256,uint256) external',
  'function stake(uint256,bool,uint256) external',
  
  // View functions
  'function supportsPermit() external view returns (bool)',
  'function challengeCount() external view returns (uint256)',
  'function getChallenge(uint256) external view returns (tuple(string,address,uint256,uint256,uint256,bool,bool,uint256,uint256,bool,bool))',
  
  // Events
  'event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 creatorWager, uint256 deadline, uint256 votingDeadline)',
];

const USDC_ABI = [
  'function approve(address,uint256) external returns (bool)',
  'function allowance(address,address) external view returns (uint256)',
  'function balanceOf(address) external view returns (uint256)',
];

// ============================================
// MAIN HOOK
// ============================================

export function useCreateChallenge(
  provider: ethers.Provider | null,
  signer: ethers.Signer | null,
  contractAddress: string,
  usdcAddress: string,
  apiBaseUrl: string
): UseCreateChallengeResult {
  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<CreateChallengeStep>('idle');
  const [onchainData, setOnchainData] = useState<OnchainChallengeData | null>(null);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const [supportsPermit, setSupportsPermit] = useState<boolean | null>(null);
  const [estimatedGas, setEstimatedGas] = useState<string | null>(null);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  const parseDateTime = useCallback((date: string, time: string): number => {
    const [day, month, year] = date.split('/').map(Number);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return Math.floor(new Date(year, month - 1, day, hours, minutes, seconds).getTime() / 1000);
  }, []);

  const extractChallengeIdFromReceipt = useCallback((receipt: ethers.TransactionReceipt): number => {
    const iface = new ethers.Interface(GRINDARENA_ABI);
    
    for (const log of receipt.logs) {
      try {
        const parsed = iface.parseLog({
          topics: [...log.topics],
          data: log.data,
        });
        
        if (parsed && parsed.name === 'ChallengeCreated') {
          return Number(parsed.args[0]);
        }
      } catch (e) {
        continue;
      }
    }
    
    throw new Error('ChallengeCreated event not found in transaction receipt');
  }, []);

  const checkPermitSupport = useCallback(async (): Promise<boolean> => {
    if (!provider) return false;
    
    try {
      const contract = new ethers.Contract(contractAddress, GRINDARENA_ABI, provider);
      const supported = await contract.supportsPermit();
      setSupportsPermit(supported);
      return supported;
    } catch (error) {
      console.error('Error checking permit support:', error);
      return false;
    }
  }, [provider, contractAddress]);

  const checkBalance = useCallback(async (userAddress: string, amount: bigint): Promise<void> => {
    if (!provider) throw new Error('Provider not available');
    
    const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, provider);
    const balance = await usdcContract.balanceOf(userAddress);
    
    if (balance < amount) {
      const balanceUSDC = ethers.formatUnits(balance, 6);
      const requiredUSDC = ethers.formatUnits(amount, 6);
      throw new Error(`Insufficient USDC balance. You have ${balanceUSDC} USDC but need ${requiredUSDC} USDC`);
    }
  }, [provider, usdcAddress]);

  // ============================================
  // CREATE WITH PERMIT (1 TRANSACTION)
  // ============================================

  const createWithPermit = useCallback(async (
    data: CreateChallengeFormData,
    userAddress: string
  ): Promise<OnchainChallengeData> => {
    if (!provider || !signer) throw new Error('Provider/signer not available');
    
    setStep('signing_permit');
    
    const stakeAmountWei = ethers.parseUnits(data.stakeAmount.toString(), 6);
    const deadline = parseDateTime(data.endDate, data.endTime);
    const votingDurationSeconds = data.votingDurationHours * 3600;

    // Check balance
    await checkBalance(userAddress, stakeAmountWei);

    // Generate permit signature
    console.log('📝 Generating permit signature...');
    const permitSig = await signPermit(
      usdcAddress,
      userAddress,
      contractAddress,
      stakeAmountWei,
      provider,
      signer
    );

    setStep('creating');
    console.log('✨ Creating challenge with permit...');

    // Create challenge with permit
    const contract = new ethers.Contract(contractAddress, GRINDARENA_ABI, signer);
    
    const tx = await contract.createChallengeWithPermit(
      data.description,
      deadline,
      votingDurationSeconds,
      stakeAmountWei,
      permitSig.deadline,
      permitSig.v,
      permitSig.r,
      permitSig.s
    );

    setStep('waiting_confirmation');
    console.log('⏳ Waiting for confirmation... Tx:', tx.hash);

    const receipt = await tx.wait();
    const challengeId = extractChallengeIdFromReceipt(receipt);

    console.log('✅ Challenge created! ID:', challengeId);

    return {
      challengeId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }, [provider, signer, contractAddress, usdcAddress, parseDateTime, checkBalance, extractChallengeIdFromReceipt]);

  // ============================================
  // CREATE WITH APPROVAL (2 TRANSACTIONS)
  // ============================================

  const createWithApproval = useCallback(async (
    data: CreateChallengeFormData,
    userAddress: string
  ): Promise<OnchainChallengeData> => {
    if (!provider || !signer) throw new Error('Provider/signer not available');
    
    const stakeAmountWei = ethers.parseUnits(data.stakeAmount.toString(), 6);
    const deadline = parseDateTime(data.endDate, data.endTime);
    const votingDurationSeconds = data.votingDurationHours * 3600;

    // Check balance
    await checkBalance(userAddress, stakeAmountWei);

    // Check current allowance
    const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
    const currentAllowance = await usdcContract.allowance(userAddress, contractAddress);

    // Approve if needed
    if (currentAllowance < stakeAmountWei) {
      setStep('approving');
      console.log('📝 Approving USDC...');
      
      const approveTx = await usdcContract.approve(contractAddress, stakeAmountWei);
      await approveTx.wait();
      
      console.log('✅ USDC approved');
    }

    setStep('creating');
    console.log('✨ Creating challenge...');

    // Create challenge
    const contract = new ethers.Contract(contractAddress, GRINDARENA_ABI, signer);
    
    const tx = await contract.createChallenge(
      data.description,
      deadline,
      votingDurationSeconds,
      stakeAmountWei
    );

    setStep('waiting_confirmation');
    console.log('⏳ Waiting for confirmation... Tx:', tx.hash);

    const receipt = await tx.wait();
    const challengeId = extractChallengeIdFromReceipt(receipt);

    console.log('✅ Challenge created! ID:', challengeId);

    return {
      challengeId,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }, [provider, signer, contractAddress, usdcAddress, parseDateTime, checkBalance, extractChallengeIdFromReceipt]);

  // ============================================
  // SAVE TO BACKEND API
  // ============================================

  const saveToBackend = useCallback(async (
    formData: CreateChallengeFormData,
    onchainData: OnchainChallengeData,
    userAddress: string
  ): Promise<any> => {
    setStep('saving_to_api');
    console.log('💾 Saving to backend API...');

    // Calculate voting deadline
    const endDateTime = parseDateTime(formData.endDate, formData.endTime);
    const votingDeadlineMs = endDateTime * 1000 + formData.votingDurationHours * 3600000;
    const votingDeadline = new Date(votingDeadlineMs).toISOString();

    const backendData: BackendChallengeData = {
      ...formData,
      Id: `${userAddress.toLowerCase()}_challenge${onchainData.challengeId}`,
      onchainChallengeId: onchainData.challengeId,
      txHash: onchainData.txHash,
      votingDeadline,
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
  }, [apiBaseUrl, parseDateTime]);

  // ============================================
  // MAIN CREATE CHALLENGE FUNCTION
  // ============================================

  const createChallenge = useCallback(async (data: CreateChallengeFormData) => {
    if (!provider || !signer) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    setStep('checking_permit');
    setOnchainData(null);
    setApiResponse(null);

    try {
      const userAddress = await signer.getAddress();
      console.log('👤 User:', userAddress);

      // Check if permit is supported
      const hasPermit = await checkPermitSupport();
      console.log('🔐 Permit support:', hasPermit ? 'YES' : 'NO');

      let result: OnchainChallengeData;

      // Try permit first (single transaction)
      if (hasPermit) {
        try {
          result = await createWithPermit(data, userAddress);
          console.log('✅ Created with permit (1 transaction)');
        } catch (permitError: any) {
          console.warn('❌ Permit failed:', permitError.message);
          
          // If permit fails, fall back to approval flow
          if (permitError.message.includes('Permit not supported') || 
              permitError.message.includes('User rejected')) {
            console.log('🔄 Falling back to approval flow...');
            result = await createWithApproval(data, userAddress);
            console.log('✅ Created with approval (2 transactions)');
          } else {
            throw permitError;
          }
        }
      } else {
        // No permit support, use approval flow
        result = await createWithApproval(data, userAddress);
        console.log('✅ Created with approval (2 transactions)');
      }

      setOnchainData(result);

      // Save to backend
      const backendResult = await saveToBackend(data, result, userAddress);
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
  }, [provider, signer, checkPermitSupport, createWithPermit, createWithApproval, saveToBackend]);

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
    setEstimatedGas(null);
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
    estimatedGas,
    reset,
  };
}

// ============================================
// STEP DESCRIPTIONS (for UI)
// ============================================

export const STEP_MESSAGES: Record<CreateChallengeStep, string> = {
  idle: '',
  checking_permit: '🔍 Checking permit support...',
  signing_permit: '📝 Please sign the permit message in your wallet...',
  approving: '⏳ Approving USDC... (Transaction 1/2)',
  creating: '⏳ Creating challenge on blockchain...',
  waiting_confirmation: '⏳ Waiting for transaction confirmation...',
  saving_to_api: '💾 Saving challenge details to database...',
  success: '✅ Challenge created successfully!',
  error: '❌ An error occurred',
};