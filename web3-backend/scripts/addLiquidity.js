import hre from "hardhat";

async function main() {
  console.log("Adding liquidity to SimpleSwap pool...\n");

  // Contract addresses from deployment
  const TOKEN_A = "0xF64f05F486155fAc6Cb36750Ef530f839f3ab9A0";
  const TOKEN_B = "0xBD0d58F20A8c3F99Eaf282ec81e687dA14813754";
  const SIMPLE_SWAP = "0x4b019C9C7636277C7D9944880180DC592944fc33";

  // Amounts to add (in tokens, will be converted to wei)
  const AMOUNT_A = "10000"; // 10,000 TKA
  const AMOUNT_B = "10000"; // 10,000 TKB

  // Get signer
  const [signer] = await hre.ethers.getSigners();
  console.log("Using account:", signer.address);

  // Get contract instances
  const tokenA = await hre.ethers.getContractAt("MockToken", TOKEN_A);
  const tokenB = await hre.ethers.getContractAt("MockToken", TOKEN_B);
  const simpleSwap = await hre.ethers.getContractAt("SimpleSwap", SIMPLE_SWAP);

  // Convert amounts to wei
  const amountAWei = hre.ethers.parseEther(AMOUNT_A);
  const amountBWei = hre.ethers.parseEther(AMOUNT_B);

  // Check balances
  const balanceA = await tokenA.balanceOf(signer.address);
  const balanceB = await tokenB.balanceOf(signer.address);
  console.log(`\nYour balances:`);
  console.log(`TKA: ${hre.ethers.formatEther(balanceA)}`);
  console.log(`TKB: ${hre.ethers.formatEther(balanceB)}`);

  if (balanceA < amountAWei || balanceB < amountBWei) {
    console.log("\n⚠️  Insufficient balance!");
    console.log("You need at least", AMOUNT_A, "TKA and", AMOUNT_B, "TKB");
    return;
  }

  // Approve tokens
  console.log("\n1. Approving TokenA...");
  const approveA = await tokenA.approve(SIMPLE_SWAP, amountAWei);
  await approveA.wait();
  console.log("✅ TokenA approved");

  console.log("\n2. Approving TokenB...");
  const approveB = await tokenB.approve(SIMPLE_SWAP, amountBWei);
  await approveB.wait();
  console.log("✅ TokenB approved");

  // Add liquidity
  console.log("\n3. Adding liquidity...");
  const addLiq = await simpleSwap.addLiquidity(amountAWei, amountBWei);
  await addLiq.wait();
  console.log("✅ Liquidity added!");

  // Check reserves
  const [reserveA, reserveB] = await simpleSwap.getReserves();
  console.log("\n=== Pool Reserves ===");
  console.log("TKA:", hre.ethers.formatEther(reserveA));
  console.log("TKB:", hre.ethers.formatEther(reserveB));
  console.log("\n✅ Liquidity addition complete!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
