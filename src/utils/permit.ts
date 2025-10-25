// utils/permit.ts
import { ethers } from 'ethers';

export interface PermitSignature {
  v: number;
  r: string;
  s: string;
  deadline: number;
}

/**
 * Check if a token supports EIP-2612 permit
 */
export async function supportsPermit(
  tokenAddress: string,
  provider: ethers.Provider
): Promise<boolean> {
  const contract = new ethers.Contract(
    tokenAddress,
    ['function DOMAIN_SEPARATOR() view returns (bytes32)'],
    provider
  );

  try {
    await contract.DOMAIN_SEPARATOR();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the permit domain for a token
 */
async function getPermitDomain(
  tokenAddress: string,
  provider: ethers.Provider
): Promise<ethers.TypedDataDomain> {
  const contract = new ethers.Contract(
    tokenAddress,
    [
      'function name() view returns (string)',
      'function version() view returns (string)',
    ],
    provider
  );

  const [name, chainId] = await Promise.all([
    contract.name(),
    provider.getNetwork().then(n => n.chainId),
  ]);

  // Try to get version, default to '1' or '2' for USDC
  let version: string;
  try {
    version = await contract.version();
  } catch {
    // USDC v2 on Base/Arbitrum/Optimism uses version '2'
    // Check by trying to call a v2-specific function
    try {
      const v2Contract = new ethers.Contract(
        tokenAddress,
        ['function PERMIT_TYPEHASH() view returns (bytes32)'],
        provider
      );
      await v2Contract.PERMIT_TYPEHASH();
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

/**
 * Sign an EIP-2612 permit message
 * @param tokenAddress - Address of the ERC20 token
 * @param userAddress - Address of the token owner
 * @param spenderAddress - Address that will be approved to spend tokens
 * @param amount - Amount to approve (in wei)
 * @param provider - Ethers provider
 * @param signer - Ethers signer
 * @returns Permit signature (v, r, s, deadline)
 */
export async function signPermit(
  tokenAddress: string,
  userAddress: string,
  spenderAddress: string,
  amount: bigint,
  provider: ethers.Provider,
  signer: ethers.Signer,
  deadlineOffset: number = 3600 // 1 hour default
): Promise<PermitSignature> {
  // Check if token supports permit
  const hasPermit = await supportsPermit(tokenAddress, provider);
  if (!hasPermit) {
    throw new Error('Token does not support EIP-2612 permit');
  }

  // Get nonce
  const tokenContract = new ethers.Contract(
    tokenAddress,
    ['function nonces(address) view returns (uint256)'],
    provider
  );
  const nonce = await tokenContract.nonces(userAddress);

  // Get domain
  const domain = await getPermitDomain(tokenAddress, provider);

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
  };

  // Values to sign
  const values = {
    owner: userAddress,
    spender: spenderAddress,
    value: amount,
    nonce,
    deadline,
  };

  try {
    // Sign typed data
    const signature = await signer.signTypedData(domain, types, values);
    const { v, r, s } = ethers.Signature.from(signature);

    return { v, r, s, deadline };
  } catch (error: any) {
    if (error.code === 'ACTION_REJECTED') {
      throw new Error('User rejected signature request');
    }
    throw error;
  }
}

/**
 * Helper to get USDC address for different chains
 */
export const USDC_ADDRESSES: Record<number, string> = {
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

/**
 * Format amount for USDC (6 decimals)
 */
export function formatUSDCAmount(amount: string | number): bigint {
  return ethers.parseUnits(amount.toString(), 6);
}

/**
 * Parse USDC amount from wei
 */
export function parseUSDCAmount(amountWei: bigint): string {
  return ethers.formatUnits(amountWei, 6);
}

// Example usage:
/*
import { signPermit, formatUSDCAmount, getApprovalStrategy } from './utils/permit';

// Check strategy
const strategy = getApprovalStrategy(chainId);
console.log(`Use ${strategy} for this chain`);

// Sign permit
const amount = formatUSDCAmount(100); // 100 USDC
const signature = await signPermit(
  usdcAddress,
  userAddress,
  contractAddress,
  amount,
  provider,
  signer
);

console.log('Permit signature:', signature);
*/