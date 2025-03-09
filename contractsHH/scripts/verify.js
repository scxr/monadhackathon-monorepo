const hre = require("hardhat");
require('dotenv').config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  
  if (!contractAddress) {
    console.error("Please set CONTRACT_ADDRESS in your .env file");
    process.exit(1);
  }
  
  console.log(`Verifying contract at address: ${contractAddress}`);
  
  try {
    // Using Hardhat's verify task
    await hre.run("verify:verify", {
      address: contractAddress,
      contract: "contracts/ChainSocial.sol:ChainSocial",
      constructorArguments: [],
    });
    
    console.log("Contract verified successfully!");
    console.log(`View on explorer: https://testnet.monadexplorer.com/address/${contractAddress}`);
  } catch (error) {
    console.error("Verification failed:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});