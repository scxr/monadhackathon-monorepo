import { Elysia, t } from 'elysia';
import { getEthBalance, getCurrentGasPrice, getTokenInfo } from '../utils/blockchain';

// Blockchain API routes for Ethereum-related functionality
export const blockchainRoutes = new Elysia({ 
  prefix: '/blockchain',
  normalize: true
})
  // Get ETH balance for a specific address
  // Returns balance in wei to avoid floating point precision issues
  .get('/balance/:address', async ({ params }) => {
    try {
      const balance = await getEthBalance(params.address);
      return { 
        address: params.address,
        balance: balance.toString(),
        unit: 'wei'
      };
    } catch (error) {
      return { error: 'Failed to get balance', message: (error as Error).message };
    }
  }, {
    response: {
      200: t.Object({
        address: t.String(),
        balance: t.String(),
        unit: t.String()
      }),
      400: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    tags: ['Blockchain'],
    params: t.Object({
      address: t.String()
    })
  })
  // Fetch current gas price from the network
  // Useful for estimating transaction costs
  .get('/gas-price', async () => {
    try {
      const gasPrice = await getCurrentGasPrice();
      return { 
        gasPrice: gasPrice.toString(),
        unit: 'wei'
      };
    } catch (error) {
      return { error: 'Failed to get gas price', message: (error as Error).message };
    }
  }, {
    response: {
      200: t.Object({
        gasPrice: t.String(),
        unit: t.String()
      }),
      400: t.Object({
        error: t.String(),
        message: t.String()
      })
    },
    tags: ['Blockchain'],
    
  })
  // Retrieve ERC20 token information by contract address
  // Includes supply, name, symbol, decimals and current price if available
  .get('/token-info/:address', async ({ params }) => {
    try {
      const tokenInfo = await getTokenInfo(params.address);
      return tokenInfo;
    } catch (error) {
      return { error: 'Failed to get token info', message: (error as Error).message };
    }
  }, {
    tags: ['Blockchain'],
    params: t.Object({
      address: t.String()
    })
  });
