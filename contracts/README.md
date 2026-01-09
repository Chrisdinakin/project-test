# Smart Contracts

This directory contains Solidity smart contracts for the Web3 Trading dApp.

## Contracts

### MockToken.sol
A simple ERC20 token implementation for testing on Sepolia testnet. Features:
- Standard ERC20 functionality (transfer, approve, transferFrom)
- Mint function for easy testing
- Configurable name, symbol, and decimals

### SimpleSwap.sol
A basic constant product AMM (Automated Market Maker) for token swaps. Features:
- Constant product formula (x * y = k)
- 0.3% swap fee
- Add/remove liquidity functionality
- Slippage protection
- Real-time price calculation

## Deployment

To deploy these contracts on Sepolia:

1. Install Hardhat or Foundry
2. Configure your deployment script with your wallet and Sepolia RPC
3. Deploy MockToken contracts for your test tokens (e.g., USDC, WBTC)
4. Deploy SimpleSwap with the token addresses
5. Add initial liquidity to the swap contract

Example deployment addresses (replace with your deployed contracts):
```
MockUSDC: 0x...
MockWBTC: 0x...
SimpleSwap (ETH/USDC): 0x...
SimpleSwap (ETH/WBTC): 0x...
```

## Testing

These contracts are designed for testnet use only. They include features like:
- Public mint functions (for easy testing)
- Simplified logic (for educational purposes)

**Do not use in production without proper audits and security reviews.**
