require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

// Get private key from .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.21",
  networks: {
    hardhat: {
      // For local testing
    },
    monad: {
      url: "https://few-lingering-surf.monad-testnet.quiknode.pro/d817ed51ec7bbb02b6ebbe877aa3f2fdb40f51e6/",
      accounts: [PRIVATE_KEY],
      chainId: 10143 
    }
  },
  sourcify: {
    enabled: true,
    apiUrl: "https://sourcify-api-monad.blockvision.org",
    browserUrl: "https://testnet.monadexplorer.com"
  },
  etherscan: {
    enabled: false
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};