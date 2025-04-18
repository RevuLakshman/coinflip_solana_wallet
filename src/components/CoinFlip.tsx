
import { FC, useState, useEffect, useCallback, useRef } from 'react';
import { 
  useConnection, 
  useWallet 
} from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createBetTransaction, flipCoin, sendWinningsTransaction } from '@/utils/solana';
import { Coins, RefreshCw, Trophy, History, TrendingUp } from 'lucide-react';

// Define bet amount options
const BET_AMOUNTS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];

// Define game history interface
interface GameHistory {
  id: string;
  timestamp: Date;
  bet: number;
  choice: 'heads' | 'tails';
  result: 'heads' | 'tails';
  won: boolean;
  payout: number;
}

const CoinFlip: FC = () => {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [isFlipping, setIsFlipping] = useState(false);
  const [gameResult, setGameResult] = useState<'heads' | 'tails' | null>(null);
  const [choice, setChoice] = useState<'heads' | 'tails'>('heads');
  const [betAmount, setBetAmount] = useState<number>(BET_AMOUNTS[0]);
  const [gameHistory, setGameHistory] = useState<GameHistory[]>([]);
  const [transactionStatus, setTransactionStatus] = useState<string>('');
  const [gameStats, setGameStats] = useState({
    totalWon: 0,
    totalLost: 0,
    winRate: 0,
    biggestWin: 0,
  });
  const coinRef = useRef<HTMLDivElement>(null);

  // Update game stats whenever game history changes
  useEffect(() => {
    if (gameHistory.length === 0) return;

    const wins = gameHistory.filter(game => game.won);
    const totalWon = wins.reduce((acc, game) => acc + game.payout, 0);
    const totalLost = gameHistory.filter(game => !game.won).reduce((acc, game) => acc + game.bet, 0);
    const winRate = wins.length / gameHistory.length * 100;
    const biggestWin = Math.max(...wins.map(game => game.payout), 0);

    setGameStats({
      totalWon,
      totalLost,
      winRate,
      biggestWin,
    });
  }, [gameHistory]);

  const handleFlip = useCallback(async () => {
    if (!wallet.connected || isFlipping) return;
    
    setIsFlipping(true);
    setTransactionStatus('Placing bet...');
    setGameResult(null);
    
    try {
      // Process the bet transaction
      const betTx = await createBetTransaction(connection, wallet, betAmount);
      
      if (!betTx.success) {
        setTransactionStatus('Transaction failed.');
        setIsFlipping(false);
        return;
      }
      
      setTransactionStatus('Flipping coin...');
      
      // Simulate coin flip animation time
      setTimeout(async () => {
        // Get the coin flip result
        const result = flipCoin();
        setGameResult(result);
        
        const won = result === choice;
        let payout = 0;
        
        if (won) {
          setTransactionStatus('You won! Processing payout...');
          
          // Double the bet amount (minus 3% platform fee)
          const winAmount = betAmount * 2 * 0.97;
          payout = winAmount;
          
          // Send winnings to user
          const winningsTx = await sendWinningsTransaction(connection, wallet, winAmount);
          
          if (winningsTx.success) {
            setTransactionStatus(`You won ${winAmount.toFixed(2)} SOL!`);
          } else {
            setTransactionStatus('Error processing winnings.');
          }
        } else {
          setTransactionStatus(`You lost ${betAmount.toFixed(2)} SOL.`);
        }
        
        // Add to game history
        const historyItem: GameHistory = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          bet: betAmount,
          choice,
          result,
          won,
          payout: won ? payout : 0,
        };
        
        setGameHistory(prev => [historyItem, ...prev]);
        setIsFlipping(false);
      }, 3000); // 3 seconds for coin flip animation
      
    } catch (error) {
      console.error('Error during game:', error);
      setTransactionStatus('Game error. Please try again.');
      setIsFlipping(false);
    }
  }, [wallet, connection, isFlipping, betAmount, choice]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto p-4">
      <div className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-sol-purple to-sol-accent bg-clip-text text-transparent">
          SOL Flip Fortune
        </h1>
        <p className="text-muted-foreground mt-2">Flip a coin. Double your SOL.</p>
      </div>
      
      <div className="w-full flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <Card className="bg-sol-dark border-sol-purple/20 shadow-lg h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-sol-purple" />
                  <span>Place Your Bet</span>
                </CardTitle>
                {!wallet.connected && (
                  <WalletMultiButton className="bg-sol-purple hover:bg-sol-purple-dark text-white" />
                )}
                {wallet.connected && wallet.publicKey && (
                  <Badge variant="outline" className="bg-sol-purple/10 text-sol-purple border-sol-purple/20">
                    {wallet.publicKey.toString().slice(0, 4)}...{wallet.publicKey.toString().slice(-4)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                Choose heads or tails, place your bet and test your luck
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="mb-6 w-full">
                <h3 className="text-sm font-medium mb-2">Select Heads or Tails</h3>
                <ToggleGroup type="single" value={choice} onValueChange={(value) => value && setChoice(value as 'heads' | 'tails')} className="w-full">
                  <ToggleGroupItem value="heads" className="w-1/2 data-[state=on]:bg-sol-purple data-[state=on]:text-white">
                    Heads
                  </ToggleGroupItem>
                  <ToggleGroupItem value="tails" className="w-1/2 data-[state=on]:bg-sol-purple data-[state=on]:text-white">
                    Tails
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              
              <div className="mb-6 w-full">
                <h3 className="text-sm font-medium mb-2">Bet Amount (SOL)</h3>
                <ToggleGroup type="single" value={betAmount.toString()} onValueChange={(value) => value && setBetAmount(parseFloat(value))} className="w-full flex flex-wrap">
                  {BET_AMOUNTS.map(amount => (
                    <ToggleGroupItem
                      key={amount}
                      value={amount.toString()}
                      className="flex-1 min-w-[calc(33%-0.5rem)] data-[state=on]:bg-sol-purple data-[state=on]:text-white"
                    >
                      {amount}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              
              <div className="w-full space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Possible win:</span>
                  <span>{(betAmount * 2 * 0.97).toFixed(2)} SOL</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Platform fee:</span>
                  <span>3%</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                onClick={handleFlip}
                disabled={!wallet.connected || isFlipping}
                className="w-full bg-sol-purple hover:bg-sol-purple-dark text-white glow"
              >
                {isFlipping ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Coins className="mr-2 h-4 w-4" />
                )}
                {isFlipping ? 'Flipping...' : 'Flip Coin'}
              </Button>
              {transactionStatus && (
                <p className={`text-center text-sm ${gameResult ? (gameResult === choice ? 'win-text' : 'lose-text') : ''}`}>
                  {transactionStatus}
                </p>
              )}
            </CardFooter>
          </Card>
        </div>
        
        <div className="w-full md:w-1/2">
          <Card className="bg-sol-dark border-sol-purple/20 shadow-lg h-full overflow-hidden">
            <Tabs defaultValue="flip" className="h-full flex flex-col">
              <CardHeader className="pb-0">
                <TabsList className="w-full bg-sol-dark border border-border">
                  <TabsTrigger value="flip" className="flex-1 data-[state=active]:bg-sol-purple/10">
                    <Coins className="h-4 w-4 mr-2" />
                    Coin Flip
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1 data-[state=active]:bg-sol-purple/10">
                    <History className="h-4 w-4 mr-2" />
                    History
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex-1 data-[state=active]:bg-sol-purple/10">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Stats
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <TabsContent value="flip" className="flex-1 flex items-center justify-center p-6 min-h-[300px]">
                <div className="perspective-[1000px] relative">
                  <div ref={coinRef} className={`coin ${isFlipping ? 'coin-flip' : ''}`}>
                    <div className="coin__face coin__face--heads flex items-center justify-center">
                      <div className="text-lg font-bold text-white">HEADS</div>
                    </div>
                    <div className="coin__face coin__face--tails flex items-center justify-center">
                      <div className="text-lg font-bold text-white">TAILS</div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="history" className="flex-1 overflow-auto max-h-[380px]">
                {gameHistory.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-6">
                    <p className="text-muted-foreground">No games played yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Bet</TableHead>
                        <TableHead>Choice</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Payout</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {gameHistory.map((game) => (
                        <TableRow key={game.id} className="history-item">
                          <TableCell>{game.timestamp.toLocaleTimeString()}</TableCell>
                          <TableCell>{game.bet.toFixed(2)} SOL</TableCell>
                          <TableCell className="capitalize">{game.choice}</TableCell>
                          <TableCell>
                            <Badge variant={game.won ? "secondary" : "destructive"} className={`capitalize ${game.won ? "bg-sol-win/20 text-sol-win" : ""}`}>
                              {game.result}
                            </Badge>
                          </TableCell>
                          <TableCell className={game.won ? "win-text" : "lose-text"}>
                            {game.won ? `+${game.payout.toFixed(2)}` : `-${game.bet.toFixed(2)}`} SOL
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              
              <TabsContent value="stats" className="flex-1 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-sol-dark border-sol-purple/20">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Total Won</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold win-text">{gameStats.totalWon.toFixed(2)} SOL</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-sol-dark border-sol-purple/20">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Total Lost</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold lose-text">{gameStats.totalLost.toFixed(2)} SOL</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-sol-dark border-sol-purple/20">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Win Rate</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold">{gameStats.winRate.toFixed(1)}%</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-sol-dark border-sol-purple/20">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm">Biggest Win</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-xl font-bold win-text">{gameStats.biggestWin.toFixed(2)} SOL</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="mt-4">
                  <Card className="bg-sol-dark border-sol-purple/20">
                    <CardHeader className="p-4">
                      <CardTitle className="text-sm flex items-center">
                        <Trophy className="h-4 w-4 mr-2 text-sol-purple" />
                        Leaderboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-muted-foreground text-center py-4">Coming soon</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;
