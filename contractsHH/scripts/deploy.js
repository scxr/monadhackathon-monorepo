const hre = require("hardhat");

async function main() {
  console.log("Deploying ChainSocial contract...");

  const ChainSocial = await hre.ethers.getContractFactory("ChainSocial");
  const chainSocial = await ChainSocial.deploy();

  await chainSocial.waitForDeployment();
  const address = await chainSocial.getAddress();

  console.log(`ChainSocial deployed to: ${address}`);
  
  // For Sourcify verification
  console.log("Waiting for block confirmations...");
  await chainSocial.deploymentTransaction().wait(5); // Wait for 5 block confirmations
  
  console.log("Contract deployed and ready for verification");
  console.log("Run: npx hardhat verify --network monad", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});