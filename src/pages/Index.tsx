
import { FC } from 'react';
import CoinFlip from '@/components/CoinFlip';

const Index: FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sol-dark to-black py-10">
      <CoinFlip />
      
      <footer className="text-center text-xs text-muted-foreground mt-12 pb-6">
        <p>Coinflip Solana Wallet — A Solana gambling game</p>
        <p className="mt-1">Platform fee: 3% • Running on Solana Devnet</p>
        <p className="mt-3 max-w-md mx-auto">
          <span className="text-sol-purple">Note:</span> This app runs on Solana Devnet for testing. 
          Connect your wallet in devnet mode to play. No real SOL is used.
        </p>
      </footer>
    </div>
  );
};

export default Index;
