import { Elysia, t } from "elysia";
import { trade } from "../utils/trading";

// Transaction API routes for token trading operations
export const transactRoutes = new Elysia({ prefix: '/transaction' })
    // Execute token buy/sell trades
    // Handles both buying and selling with specified token amount
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
    }, {
        // response: {
        //     200: t.Object({
        //         transaction: t.Object({
        //             to: t.String(),
        //             data: t.String(),
        //             value: t.String(),
        //             gas: t.String(),
        //             gasPrice: t.String(),
        //         })
        //     }),
        //     400: t.Object({
        //         error: t.String(),
        //         message: t.String()
        //     })
        // },
        // tags: ['Transaction'],
        // body: t.Object({
        //     side: t.String(),
        //     amount: t.Number(),
        //     token: t.String(),
        //     user: t.String(),
        //     decimals: t.Optional(t.Number())
        // })
    });
    
