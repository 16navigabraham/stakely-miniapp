// lib/contracts.ts
/**
 * Smart Contract Addresses and Configuration for Base
 * Reads from environment variables and provides helper functions
 */

import { type Address } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

// ============================================
// ENVIRONMENT-BASED CONTRACT ADDRESSES
// ============================================

/**
 * Get GrindArena contract address for a specific chain
 */
export function getGrindArenaAddress(chainId: number): Address {
  const addresses: Record<number, string | undefined> = {
    [base.id]: process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE,
    [baseSepolia.id]: process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE_SEPOLIA,
  };

  const address = addresses[chainId];
  
  if (!address) {
    throw new Error(
      `GrindArena contract not configured for chain ${chainId}. ` +
      `Please set NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE in your .env.local file.`
    );
  }

  return address as Address;
}

/**
 * Get USDC contract address for a specific chain
 * These are official USDC addresses
 */
export function getUSDCAddress(chainId: number): Address {
  const addresses: Record<number, Address> = {
    // Base Mainnet - Official USDC (native, with permit)
    [base.id]: (process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE || 
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address,
    
    // Base Sepolia - Official USDC (testnet)
    [baseSepolia.id]: (process.env.NEXT_PUBLIC_USDC_CONTRACT_BASE_SEPOLIA ||
      '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as Address,
  };

  const address = addresses[chainId];
  
  if (!address) {
    throw new Error(`USDC not available on chain ${chainId}`);
  }

  return address;
}

// ============================================
// CHAIN CONFIGURATION
// ============================================

/**
 * Supported chains for the application
 */
export const SUPPORTED_CHAINS = [base, baseSepolia] as const;

/**
 * Default chain (Base Mainnet)
 */
export const DEFAULT_CHAIN = base;

/**
 * Block explorers per chain
 */
export const BLOCK_EXPLORERS: Record<number, string> = {
  [base.id]: 'https://basescan.org',
  [baseSepolia.id]: 'https://sepolia.basescan.org',
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return SUPPORTED_CHAINS.some(chain => chain.id === chainId);
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const explorer = BLOCK_EXPLORERS[chainId];
  if (!explorer) {
    throw new Error(`No explorer configured for chain ${chainId}`);
  }
  return `${explorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const explorer = BLOCK_EXPLORERS[chainId];
  if (!explorer) {
    throw new Error(`No explorer configured for chain ${chainId}`);
  }
  return `${explorer}/address/${address}`;
}

/**
 * Check if USDC supports EIP-2612 permit on this chain
 * Base has native USDC with permit support
 */
export function doesUSDCSupportPermit(chainId: number): boolean {
  // Both Base mainnet and testnet support permits
  return chainId === base.id || chainId === baseSepolia.id;
}

/**
 * Get chain name from chain ID
 */
export function getChainName(chainId: number): string {
  const names: Record<number, string> = {
    [base.id]: 'Base',
    [baseSepolia.id]: 'Base Sepolia',
  };
  return names[chainId] || `Unknown Chain (${chainId})`;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Gas estimation multipliers
 * Used for estimating transaction gas limits
 */
export const GAS_MULTIPLIERS = {
  CREATE_CHALLENGE: 1.2,      // 20% buffer
  APPROVE: 1.1,               // 10% buffer
  STAKE: 1.15,                // 15% buffer
} as const;

/**
 * Transaction timeouts (milliseconds)
 */
export const TX_TIMEOUTS = {
  APPROVAL: 120000,           // 2 minutes
  CREATE_CHALLENGE: 180000,   // 3 minutes
  STAKE: 120000,              // 2 minutes
} as const;

/**
 * Permit deadline offset (seconds)
 * How long the permit signature is valid
 */
export const PERMIT_DEADLINE_OFFSET = 3600; // 1 hour

/**
 * Minimum and maximum USDC amounts (in USDC, not wei)
 */
export const MIN_STAKE_AMOUNT = 1;      // 1 USDC minimum
export const MAX_STAKE_AMOUNT = 10000;  // 10,000 USDC maximum

// ============================================
// VALIDATION
// ============================================

/**
 * Validate that required environment variables are set
 * Call this on app startup
 */
export function validateContractConfig(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for required contract addresses
  if (!process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE) {
    errors.push('Missing NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE in environment variables');
  }

  // Validate address format (should be 0x + 40 hex chars)
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  
  if (process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE && 
      !addressRegex.test(process.env.NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE)) {
    errors.push('NEXT_PUBLIC_GRINDARENA_CONTRACT_BASE is not a valid Ethereum address');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================
// USAGE EXAMPLES
// ============================================

/*
// Example 1: Get contract addresses for Base
import { getGrindArenaAddress, getUSDCAddress } from '~/lib/contracts';
import { base } from 'wagmi/chains';

const grindArena = getGrindArenaAddress(base.id);
const usdc = getUSDCAddress(base.id);

// Example 2: Check permit support
import { doesUSDCSupportPermit } from '~/lib/contracts';

if (doesUSDCSupportPermit(chainId)) {
  console.log('Using permit flow (1 transaction)');
} else {
  console.log('Using approval flow (2 transactions)');
}

// Example 3: Get explorer URL
import { getExplorerTxUrl } from '~/lib/contracts';

const explorerUrl = getExplorerTxUrl(base.id, txHash);
console.log('View transaction:', explorerUrl);

// Example 4: Validate configuration on app startup
import { validateContractConfig } from '~/lib/contracts';

const validation = validateContractConfig();
if (!validation.valid) {
  console.error('Contract configuration errors:', validation.errors);
}
*/