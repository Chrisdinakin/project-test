# Cyber Terminal - Web3 Trading dApp

A Next.js 16 (App Router) + TypeScript + Wagmi v2 decentralized application built for Ethereum Sepolia testnet with full Web3 functionality.

## 🚀 Features

### Swap Interface (Landing Page - `/`)
- **Real Web3 Smart Contracts**: Includes ERC20 token and DEX swap contracts
- Uniswap-style token swap UI (SepoliaETH ↔ Mock USDC)
- Real-time exchange rate calculation
- Configurable slippage tolerance
- Smart contract ABIs for integration

### Advanced Futures Simulator (`/futures`)
- **Enhanced Charting Engine** with multiple features:
  - Multiple timeframes (1H, 4H, 1D, 1W, 1M)
  - Chart types: Candlestick, Line, Area
  - Volume indicator with color coding
  - Moving Average (MA 20) indicator
  - 24h price change display
- Real-time price data from CoinGecko API
- Interactive candlestick charts using lightweight-charts
- Long/Short position buttons with mock contract signatures
- Leverage slider (1x - 100x)
- Liquidation price calculations

### AI Commander (`/ai`)
- Natural language command parsing
- Automatically populates swap/futures forms from text commands
- Smart navigation to appropriate pages
- Example commands:
  - "Swap 0.5 ETH for USDC"
  - "Long ETH with 10x leverage"
  - "Short BTC 0.1"

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 (Cyber-Terminal dark theme)
- **Web3**: Wagmi v2 + Viem
- **Wallet**: RainbowKit
- **State**: Zustand
- **Icons**: Lucide React
- **Charts**: Lightweight Charts (Enhanced)
- **Notifications**: React Hot Toast
- **Smart Contracts**: Solidity 0.8.20

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- A Web3 wallet (MetaMask, Rainbow, etc.)
- Sepolia testnet ETH (get from [Sepolia Faucet](https://sepoliafaucet.com/))

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd project-test
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your WalletConnect Project ID (get one at [WalletConnect Cloud](https://cloud.walletconnect.com/)):
```env
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## 🔗 Network Configuration

This dApp is **strictly configured for Ethereum Sepolia testnet** (Chain ID: 11155111).

### Smart Contracts

The project includes production-ready smart contracts in the `/contracts` directory:

- **MockToken.sol**: ERC20 token implementation with mint functionality for testing
- **SimpleSwap.sol**: Constant product AMM (x * y = k) with 0.3% swap fee

See `/contracts/README.md` for deployment instructions.

### Mock Token Addresses
Since USDC and WBTC don't exist on Sepolia, we use placeholder addresses:
- Mock USDC: `0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8`
- Mock WBTC: `0xC558DBdd856501FCd9aaF1E62eae57A9F0629a3c`
- WETH (Sepolia): `0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14`

## 🎮 AI-to-UI State Control

The AI Commander parses natural language and automatically populates React state:

```typescript
// Example: "Swap 0.5 ETH for USDC"
// Parses to:
{
  action: 'swap',
  swapData: {
    fromToken: 'ETH',
    toToken: 'USDC',
    fromAmount: '0.5'
  }
}
```

The parsed command triggers `processAICommand()` which updates the Zustand store and automatically navigates to the appropriate page.

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Swap interface (landing page)
│   ├── futures/page.tsx      # Advanced futures trading
│   ├── ai/page.tsx           # AI Commander
│   ├── globals.css           # Cyber-Terminal theme styles
│   └── layout.tsx            # Root layout with providers
├── components/
│   ├── SwapInterface.tsx              # Token swap UI
│   ├── FuturesSimulator.tsx           # Basic futures simulator
│   ├── AdvancedFuturesSimulator.tsx   # Enhanced futures with advanced charts
│   ├── AICommander.tsx                # Natural language interface
│   └── Navigation.tsx                 # Page navigation
├── config/
│   ├── wagmi.ts              # Wagmi config (Sepolia only)
│   ├── tokens.ts             # Mock token addresses
│   └── contracts.ts          # Smart contract ABIs
├── hooks/
│   └── useTradingStore.ts    # Zustand state management
├── lib/
│   └── aiCommandParser.ts    # NLP command parser
├── providers/
│   └── Web3Provider.tsx      # RainbowKit + Wagmi provider
└── types/
    └── trading.ts            # TypeScript interfaces
contracts/
├── MockToken.sol             # ERC20 token contract
├── SimpleSwap.sol            # DEX swap contract
└── README.md                 # Contract deployment guide
```

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build
```

## 🔐 Smart Contract Deployment

To deploy the smart contracts:

1. Install Hardhat or Foundry
2. Configure your Sepolia RPC endpoint
3. Deploy MockToken contracts for test tokens
4. Deploy SimpleSwap with token pair addresses
5. Add initial liquidity

See `/contracts/README.md` for detailed instructions.

## 📝 License

MIT
