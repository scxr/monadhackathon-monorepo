import { Elysia } from "elysia";
import { trade } from "../utils/trading";
export const transactRoutes = new Elysia({ prefix: '/transaction' })
    .post('/trade', async ({ body }) => {
        const { side, amount, token, user, decimals } = body as {
            side: 'buy' | 'sell';
            amount: number;
            token: string;
            user: string;
            decimals: null | number;
        }

        console.log(side, amount, token, user, decimals);
        const transaction = await trade(side, amount, token, user, decimals);
        return transaction;
    });
    
