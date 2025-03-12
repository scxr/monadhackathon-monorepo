import { Elysia, t } from 'elysia';
import { getEthBalance, getCurrentGasPrice, getTokenInfo } from '../utils/blockchain';

// Create blockchain-related routes
export const blockchainRoutes = new Elysia({ 
  prefix: '/blockchain',
  normalize: true
})
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
  .get('/token-info/:address', async ({ params }) => {
    try {
      const tokenInfo = await getTokenInfo(params.address);
      return { tokenInfo };
    } catch (error) {
      return { error: 'Failed to get token info', message: (error as Error).message };
    }
  }, {
    response: {
      200: t.Object({
        tokenInfo: t.Object({
          supply: t.BigInt(),
          parsedSupply: t.Number(),
          decimals: t.Number(),
          name: t.String(),
          symbol: t.String(),
          price: t.String()
        })
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
  });
