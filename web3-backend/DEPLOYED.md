# Web3 Backend - Deployed Contracts

## Deployed Contracts on Sepolia

### Token A (TKA)
- **Address:** `0xF64f05F486155fAc6Cb36750Ef530f839f3ab9A0`
- **Name:** Token A
- **Symbol:** TKA
- **Decimals:** 18
- **Initial Supply:** 1,000,000 TKA

### Token B (TKB)
- **Address:** `0xBD0d58F20A8c3F99Eaf282ec81e687dA14813754`
- **Name:** Token B
- **Symbol:** TKB
- **Decimals:** 18
- **Initial Supply:** 1,000,000 TKB

### SimpleSwap DEX
- **Address:** `0x4b019C9C7636277C7D9944880180DC592944fc33`
- **Token Pair:** TKA/TKB
- **Fee:** 0.3%
- **Formula:** Constant Product (x * y = k)

## View on Etherscan

- [TokenA on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xF64f05F486155fAc6Cb36750Ef530f839f3ab9A0)
- [TokenB on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xBD0d58F20A8c3F99Eaf282ec81e687dA14813754)
- [SimpleSwap on Sepolia Etherscan](https://sepolia.etherscan.io/address/0x4b019C9C7636277C7D9944880180DC592944fc33)

## Adding Liquidity

To add liquidity to the pool and enable swaps:

```bash
npx hardhat run scripts/addLiquidity.js --network sepolia
```

**Note:** Make sure you have TKA and TKB tokens in your wallet before adding liquidity.

## Deployment Script

To deploy new contracts:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

## Environment Setup

Create a `.env` file in the `web3-backend` directory:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

## Frontend Integration

The frontend is already configured with these contract addresses in:
- `/src/config/contracts.ts` - Contract ABIs and addresses
- `/src/config/tokens.ts` - Token addresses and decimals

The SwapInterface component now:
- ✅ Reads from actual deployed contracts
- ✅ Shows real token balances
- ✅ Displays pool reserves
- ✅ Executes real swaps on-chain
- ✅ Requires token approval before swapping

## Testing the Swap

1. **Get test tokens:** You own the deployed tokens, so you already have the initial supply
2. **Add liquidity:** Run the `addLiquidity.js` script to add liquidity to the pool
3. **Connect wallet:** Connect your MetaMask to the frontend on Sepolia
4. **Approve tokens:** Click "Approve" to allow the SimpleSwap contract to spend your tokens
5. **Swap:** Enter an amount and click "Swap" to execute the trade

## Contract Features

### MockToken
- Standard ERC20 implementation
- Transfer, approve, transferFrom functions
- View balance, allowance, and total supply

### SimpleSwap
- Add/remove liquidity
- Swap tokens with 0.3% fee
- Get expected output amount (getAmountOut)
- View current reserves (getReserves)
- Slippage protection

## Next Steps

1. Add liquidity to enable swaps
2. Test the swap functionality on the frontend
3. Monitor transactions on Sepolia Etherscan
4. Optionally deploy more token pairs

## Security Notes

⚠️ **These contracts are for testnet use only**
- Not audited for production use
- Contains simplified logic for educational purposes
- Use at your own risk on mainnet
