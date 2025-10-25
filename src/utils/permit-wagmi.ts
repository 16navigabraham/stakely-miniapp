// utils/permit-wagmi.ts
import { type Address, type Hash, parseUnits, formatUnits } from 'viem';
import type { PublicClient, WalletClient } from 'viem';

export interface PermitSignature {
  v: number;
  r: Hash;
  s: Hash;
  deadline: number;
}

// ============================================
// PERMIT SUPPORT CHECK
// ============================================

/**
 * Check if a token supports EIP-2612 permit
 */
export async function supportsPermit(
  tokenAddress: Address,
  publicClient: PublicClient
): Promise<boolean> {
  try {
    const data = await publicClient.readContract({
      address: tokenAddress,
      abi: [
        {
          name: 'DOMAIN_SEPARATOR',
          type: 'function',
          stateMutability: 'view',
          inputs: [],
          outputs: [{ name: '', type: 'bytes32' }],
        },
      ],
      functionName: 'DOMAIN_SEPARATOR',
    });
    return !!data;
  } catch {
    return false;
  }
}

// ============================================
// DOMAIN HELPERS
// ============================================

/**
 * Get the permit domain for a token
 */
async function getPermitDomain(
  tokenAddress: Address,
  publicClient: PublicClient
): Promise<{
  name: string;
  version: string;
  chainId: number;
  verifyingContract: Address;
}> {
  const abi = [
    {
      name: 'name',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
    {
      name: 'version',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ name: '', type: 'string' }],
    },
  ] as const;

  const [name, chainId] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress,
      abi,
      functionName: 'name',
    }),
    publicClient.getChainId(),
  ]);

  // Try to get version, default to '1' or '2' for USDC
  let version: string;
  try {
    version = await publicClient.readContract({
      address: tokenAddress,
      abi,
      functionName: 'version',
    });
  } catch {
    // USDC v2 on Base/Arbitrum/Optimism uses version '2'
    try {
      await publicClient.readContract({
        address: tokenAddress,
        abi: [
          {
            name: 'PERMIT_TYPEHASH',
            type: 'function',
            stateMutability: 'view',
            inputs: [],
            outputs: [{ name: '', type: 'bytes32' }],
          },
        ],
        functionName: 'PERMIT_TYPEHASH',
      });
      version = '2';
    } catch {
      version = '1';
    }
  }

  return {
    name,
    version,
    chainId,
    verifyingContract: tokenAddress,
  };
}

// ============================================
// MAIN PERMIT SIGNING FUNCTION
// ============================================

/**
 * Sign an EIP-2612 permit message using Wagmi
 * Works with any Wagmi-compatible wallet including Farcaster wallets
 * 
 * @param tokenAddress - Address of the ERC20 token
 * @param userAddress - Address of the token owner
 * @param spenderAddress - Address that will be approved to spend tokens
 * @param amount - Amount to approve (in wei)
 * @param publicClient - Viem public client
 * @param walletClient - Viem wallet client
 * @param deadlineOffset - Seconds until permit expires (default 1 hour)
 * @returns Permit signature (v, r, s, deadline)
 */
export async function signPermit(
  tokenAddress: Address,
  userAddress: Address,
  spenderAddress: Address,
  amount: bigint,
  publicClient: PublicClient,
  walletClient: WalletClient,
  deadlineOffset: number = 3600 // 1 hour default
): Promise<PermitSignature> {
  // Check if token supports permit
  const hasPermit = await supportsPermit(tokenAddress, publicClient);
  if (!hasPermit) {
    throw new Error('Token does not support EIP-2612 permit');
  }

  // Get nonce
  const nonce = await publicClient.readContract({
    address: tokenAddress,
    abi: [
      {
        name: 'nonces',
        type: 'function',
        stateMutability: 'view',
        inputs: [{ name: 'owner', type: 'address' }],
        outputs: [{ name: '', type: 'uint256' }],
      },
    ],
    functionName: 'nonces',
    args: [userAddress],
  });

  // Get domain
  const domain = await getPermitDomain(tokenAddress, publicClient);

  // Set deadline
  const deadline = Math.floor(Date.now() / 1000) + deadlineOffset;

  // EIP-2612 types
  const types = {
    Permit: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
  } as const;

  // Values to sign
  const message = {
    owner: userAddress,
    spender: spenderAddress,
    value: amount,
    nonce,
    deadline: BigInt(deadline),
  };

  try {
    // Sign typed data with Wagmi wallet client
    const signature = await walletClient.signTypedData({
      account: userAddress,
      domain: {
        name: domain.name,
        version: domain.version,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
      },
      types,
      primaryType: 'Permit',
      message,
    });

    // Parse signature into v, r, s
    const r = signature.slice(0, 66) as Hash;
    const s = ('0x' + signature.slice(66, 130)) as Hash;
    const v = parseInt(signature.slice(130, 132), 16);

    return { v, r, s, deadline };
  } catch (error: any) {
    // Handle user rejection gracefully
    if (error.message?.includes('rejected') || 
        error.message?.includes('denied') ||
        error.message?.includes('User rejected')) {
      throw new Error('User rejected signature request');
    }
    
    // Handle wallet-specific errors
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      throw new Error('User rejected signature request');
    }
    
    throw error;
  }
}

// ============================================
// CHAIN-SPECIFIC HELPERS
// ============================================

/**
 * USDC addresses for different chains
 */
export const USDC_ADDRESSES: Record<number, Address> = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // Ethereum Mainnet (no permit)
  10: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Optimism (has permit)
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon (no permit - bridged)
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base (has permit)
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum One (has permit)
};

/**
 * Check if USDC on a specific chain supports permit
 */
export function doesChainUSDCSupportPermit(chainId: number): boolean {
  const permitSupportedChains = [10, 8453, 42161]; // Optimism, Base, Arbitrum
  return permitSupportedChains.includes(chainId);
}

/**
 * Get recommended approval strategy for a chain
 */
export function getApprovalStrategy(chainId: number): 'permit' | 'approval' | 'max-approval' {
  if (doesChainUSDCSupportPermit(chainId)) {
    return 'permit';
  }
  // For chains without permit, recommend max approval to avoid repeated transactions
  return 'max-approval';
}

// ============================================
// AMOUNT FORMATTING HELPERS
// ============================================

/**
 * Format amount for USDC (6 decimals)
 */
export function formatUSDCAmount(amount: string | number): bigint {
  return parseUnits(amount.toString(), 6);
}

/**
 * Parse USDC amount from wei to human-readable
 */
export function parseUSDCAmount(amountWei: bigint): string {
  return formatUnits(amountWei, 6);
}

// ============================================
// WAGMI HOOK VERSION
// ============================================

import { usePublicClient, useWalletClient, useAccount } from 'wagmi';
import { useCallback, useState } from 'react';

/**
 * React hook for signing permits with Wagmi
 * Integrates seamlessly with Farcaster wallets and any Wagmi connector
 */
export function usePermitSigner(tokenAddress: Address, spenderAddress: Address) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signPermitAsync = useCallback(
    async (amount: bigint, deadlineOffset?: number): Promise<PermitSignature> => {
      if (!address || !publicClient || !walletClient) {
        throw new Error('Wallet not connected');
      }

      setIsSigning(true);
      setError(null);

      try {
        const signature = await signPermit(
          tokenAddress,
          address,
          spenderAddress,
          amount,
          publicClient,
          walletClient,
          deadlineOffset
        );

        setIsSigning(false);
        return signature;
      } catch (err: any) {
        const errorMessage = err.message || 'Failed to sign permit';
        setError(errorMessage);
        setIsSigning(false);
        throw err;
      }
    },
    [address, publicClient, walletClient, tokenAddress, spenderAddress]
  );

  const checkPermitSupport = useCallback(async (): Promise<boolean> => {
    if (!publicClient) return false;
    return supportsPermit(tokenAddress, publicClient);
  }, [publicClient, tokenAddress]);

  return {
    signPermitAsync,
    checkPermitSupport,
    isSigning,
    error,
  };
}

// ============================================
// EXAMPLE USAGE WITH FARCASTER
// ============================================

/*
// In your component:
import { usePermitSigner, formatUSDCAmount } from '~/utils/permit-wagmi';
import { useFarcasterAuth } from '~/hooks/useFarcasterAuth';

function MyComponent() {
  const { farcasterUser, isFullyAuthenticated } = useFarcasterAuth('YOUR_NEYNAR_API_KEY');
  const { signPermitAsync, isSigning, error } = usePermitSigner(
    usdcAddress,
    contractAddress
  );

  const handleCreateChallenge = async () => {
    if (!isFullyAuthenticated) {
      alert('Please connect wallet and authenticate with Farcaster');
      return;
    }

    try {
      // Sign permit
      const amount = formatUSDCAmount(100); // 100 USDC
      const permitSig = await signPermitAsync(amount);
      
      // Use permit signature in contract call
      console.log('Permit signature:', permitSig);
      
      // Call contract with permit
      // ... your contract interaction
      
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <p>Farcaster: {farcasterUser?.username || 'Not connected'}</p>
      <button onClick={handleCreateChallenge} disabled={isSigning}>
        {isSigning ? 'Signing...' : 'Create Challenge'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
*/