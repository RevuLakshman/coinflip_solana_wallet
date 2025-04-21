
import { 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  Connection 
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Platform wallet address (3% fee will go here)
const PLATFORM_WALLET = new PublicKey('9vHZdHFogR41vxGb9TeEwLJeyzGrJ3aDrTmvgtBAGQUn');
const PLATFORM_FEE_PERCENT = 3;

// Convert SOL to lamports (1 SOL = 1,000,000,000 lamports)
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

/**
 * Create and send a transaction to bet SOL on a coin flip
 */
export const createBetTransaction = async (
  connection: Connection,
  wallet: WalletContextState,
  betAmount: number
): Promise<{ txId: string; success: boolean }> => {
  try {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new Error('Wallet not connected');
    }

    const lamports = solToLamports(betAmount);
    const platformFee = Math.floor(lamports * (PLATFORM_FEE_PERCENT / 100));
    
    // Create a transaction to send SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: PLATFORM_WALLET,
        lamports: platformFee,
      })
    );

    // Set recent blockhash and fee payer
    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    transaction.recentBlockhash = blockhash;
    transaction.feePayer = wallet.publicKey;

    // Sign the transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    // Send the transaction
    const signature = await connection.sendRawTransaction(signedTransaction.serialize());
    
    // Confirm the transaction
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
      minContextSlot,
    });

    return { txId: signature, success: true };
  } catch (error) {
    console.error('Bet transaction error:', error);
    return { txId: '', success: false };
  }
};

/**
 * Send winnings to the user if they win the bet
 */
export const sendWinningsTransaction = async (
  connection: Connection,
  wallet: WalletContextState,
  betAmount: number
): Promise<{ txId: string; success: boolean }> => {
  try {
    // This would be called from a server in a real implementation
    // For simplicity, we're simulating this on the client side

    // In a real implementation, this private key would be stored securely on a server
    // This is just a placeholder - in a real app you would use a backend service for this
    
    return { 
      txId: 'simulated-transaction-id-' + new Date().getTime(),
      success: true 
    };
  } catch (error) {
    console.error('Send winnings transaction error:', error);
    return { txId: '', success: false };
  }
};

/**
 * Determine the result of a coin flip
 * In a production environment, this would use a verifiable random function
 */
export const flipCoin = (): 'heads' | 'tails' => {
  // For demo purposes, we're using a simple random number generator
  // In production, you would use a verifiable random function or oracle
  return Math.random() < 0.5 ? 'heads' : 'tails';
};
