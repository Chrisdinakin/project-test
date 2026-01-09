// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function decimals() external view returns (uint8);
}

/**
 * @title SimpleSwap
 * @dev Basic constant product AMM (x * y = k) for token swaps on Sepolia
 */
contract SimpleSwap {
    address public tokenA;
    address public tokenB;
    uint256 public reserveA;
    uint256 public reserveB;
    uint256 public constant FEE_PERCENT = 3; // 0.3% fee
    uint256 public constant FEE_DENOMINATOR = 1000;

    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );
    event LiquidityAdded(address indexed provider, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(address indexed provider, uint256 amountA, uint256 amountB);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != address(0) && _tokenB != address(0), "Invalid token addresses");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    /**
     * @dev Add liquidity to the pool
     */
    function addLiquidity(uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Invalid amounts");

        IERC20(tokenA).transferFrom(msg.sender, address(this), amountA);
        IERC20(tokenB).transferFrom(msg.sender, address(this), amountB);

        reserveA += amountA;
        reserveB += amountB;

        emit LiquidityAdded(msg.sender, amountA, amountB);
    }

    /**
     * @dev Swap tokenA for tokenB or vice versa
     */
    function swap(
        address tokenIn,
        uint256 amountIn,
        uint256 minAmountOut
    ) external returns (uint256 amountOut) {
        require(amountIn > 0, "Invalid input amount");
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(reserveA > 0 && reserveB > 0, "No liquidity");

        bool isTokenA = tokenIn == tokenA;
        address tokenOut = isTokenA ? tokenB : tokenA;

        // Calculate output amount using constant product formula
        // amountOut = (amountIn * reserveOut) / (reserveIn + amountIn)
        // With fee: amountIn = amountIn * (1 - fee)
        uint256 amountInWithFee = (amountIn * (FEE_DENOMINATOR - FEE_PERCENT)) / FEE_DENOMINATOR;

        if (isTokenA) {
            amountOut = (amountInWithFee * reserveB) / (reserveA + amountInWithFee);
            require(amountOut >= minAmountOut, "Insufficient output amount");
            require(amountOut <= reserveB, "Insufficient liquidity");

            // Update reserves BEFORE external calls (checks-effects-interactions pattern)
            reserveA += amountIn;
            reserveB -= amountOut;

            // External calls after state updates
            IERC20(tokenA).transferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenB).transfer(msg.sender, amountOut);
        } else {
            amountOut = (amountInWithFee * reserveA) / (reserveB + amountInWithFee);
            require(amountOut >= minAmountOut, "Insufficient output amount");
            require(amountOut <= reserveA, "Insufficient liquidity");

            // Update reserves BEFORE external calls (checks-effects-interactions pattern)
            reserveB += amountIn;
            reserveA -= amountOut;

            // External calls after state updates
            IERC20(tokenB).transferFrom(msg.sender, address(this), amountIn);
            IERC20(tokenA).transfer(msg.sender, amountOut);
        }

        emit Swap(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
        return amountOut;
    }

    /**
     * @dev Get expected output amount for a swap
     */
    function getAmountOut(address tokenIn, uint256 amountIn) external view returns (uint256) {
        require(tokenIn == tokenA || tokenIn == tokenB, "Invalid token");
        require(reserveA > 0 && reserveB > 0, "No liquidity");

        bool isTokenA = tokenIn == tokenA;
        uint256 amountInWithFee = (amountIn * (FEE_DENOMINATOR - FEE_PERCENT)) / FEE_DENOMINATOR;

        if (isTokenA) {
            return (amountInWithFee * reserveB) / (reserveA + amountInWithFee);
        } else {
            return (amountInWithFee * reserveA) / (reserveB + amountInWithFee);
        }
    }

    /**
     * @dev Get current reserves
     */
    function getReserves() external view returns (uint256, uint256) {
        return (reserveA, reserveB);
    }
}
