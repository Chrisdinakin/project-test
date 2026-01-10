import hre from "hardhat";

async function main() {
  console.log("Starting deployment...");

  // Deploy TokenA (MockToken)
  console.log("Deploying TokenA...");
  const TokenA = await hre.ethers.getContractFactory("MockToken");
  const tokenA = await TokenA.deploy("Token A", "TKA", 18, 1000000);
  await tokenA.waitForDeployment();
  const tokenAAddress = await tokenA.getAddress();
  console.log("TokenA deployed to:", tokenAAddress);

  // Deploy TokenB (MockToken)
  console.log("Deploying TokenB...");
  const TokenB = await hre.ethers.getContractFactory("MockToken");
  const tokenB = await TokenB.deploy("Token B", "TKB", 18, 1000000);
  await tokenB.waitForDeployment();
  const tokenBAddress = await tokenB.getAddress();
  console.log("TokenB deployed to:", tokenBAddress);

  // Deploy SimpleSwap
  console.log("Deploying SimpleSwap...");
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const simpleSwap = await SimpleSwap.deploy(tokenAAddress, tokenBAddress);
  await simpleSwap.waitForDeployment();
  const simpleSwapAddress = await simpleSwap.getAddress();
  console.log("SimpleSwap deployed to:", simpleSwapAddress);

  console.log("\n=== Deployment Summary ===");
  console.log("TokenA:", tokenAAddress);
  console.log("TokenB:", tokenBAddress);
  console.log("SimpleSwap:", simpleSwapAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
