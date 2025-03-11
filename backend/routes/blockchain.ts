import { Elysia } from 'elysia';
import { getEthBalance, getCurrentGasPrice, getTokenInfo } from '../utils/blockchain';

// Create blockchain-related routes
export const blockchainRoutes = new Elysia({ prefix: '/blockchain' })
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
  })
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
  })
  .get('/token-info/:address', async ({ params }) => {
    try {
      const tokenInfo = await getTokenInfo(params.address);
      return tokenInfo;
    } catch (error) {
      return { error: 'Failed to get token info', message: (error as Error).message };
    }
  });
