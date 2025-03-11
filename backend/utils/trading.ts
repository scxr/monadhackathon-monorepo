
export async function trade(side: 'buy' | 'sell', amount: number, token: string, user: string, decimals: null|number) {
    if (side == "sell" && !decimals) {
        throw new Error("Decimals are required for selling");
    }
    let url = new URL(`https://api.0x.org/swap/permit2/quote`)
    url.searchParams.set('sellToken', side == "buy" ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': token)
    url.searchParams.set('buyToken', side == "buy" ? token : '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE')
    url.searchParams.set('sellAmount', `${amount * (10 ** (decimals ?? 18))}`);
    url.searchParams.set('slippagePercentage', '10')
    url.searchParams.set('chainId', '10143')
    url.searchParams.set('taker', user)

    const response = await Bun.fetch(url.toString(), {
        headers: {
            '0x-version': 'v2',
            '0x-api-key': '116b9077-7bb3-4c69-ba5a-42f8c1a965a7',
        },
    });

    const data = await response.json();
    console.log(data)
    if (!data.transaction) {
        return {
            success: false,
            error: "No quote found"
        }
    }
    console.log(data)
    return data.transaction
}

// trade('buy', 1, '0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714', '0x4c2e0165ca1123608cff84f7805b6c57be9c3813', null)