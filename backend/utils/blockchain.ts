import { erc20Abi } from 'viem';
import { publicClient } from '../index';
// Example function that uses the global publicClient
export async function getEthBalance(address: string) {
  const balance = await publicClient.getBalance({
    address: address as `0x${string}`
  });
  
  return balance;
}

// Example function to get gas price
export async function getCurrentGasPrice() {
  const gasPrice = await publicClient.getGasPrice();
  return gasPrice;
} 

// export async function getTokenInfo(tokenAddress: string) {
//   const tokenInfo = await publicClient.readContract({
//     address: tokenAddress as `0x${string}`,
//     abi: erc20Abi,
//     functionName: 'totalSupply',
//   });
//   return tokenInfo;
// }

// Extend BigInt prototype to handle JSON serialization
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
}

export async function getTokenInfo(tokenAddress: string) {
  let [supply, decimals, name, symbol] = await Promise.all([
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'totalSupply',
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'decimals',
    }),
    publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'name',
    }),
    publicClient.readContract({ 
      address: tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: 'symbol',
    }),
  ]);
  let parsedSupply = Number(supply) / 1e6;
  let price = await getTokenPriceFromApi(tokenAddress, decimals);
  return { supply, parsedSupply, decimals, name, symbol, price: price.toString() };
}


async function getTokenPriceFromApi(tokenAddress: string, decimals: number) {

  let url = new URL(`https://api.0x.org/swap/permit2/quote`)
  url.searchParams.set('sellToken', tokenAddress)
  url.searchParams.set('buyToken', '0xf817257fed379853cDe0fa4F97AB987181B1E5Ea')
  url.searchParams.set('sellAmount', `${1 * (10 ** decimals)}`)
  url.searchParams.set('slippagePercentage', '0')
  url.searchParams.set('chainId', '10143')
  url.searchParams.set('taker', '0x4c2e0165ca1123608cff84f7805b6c57be9c3813')

  const response = await fetch(url.toString(), {
    headers: {
      '0x-version': 'v2',
      '0x-api-key': '116b9077-7bb3-4c69-ba5a-42f8c1a965a7',
    },
  });
  const data = await response.json();
  if (!data.buyAmount) {
    return 0;
  }
  console.log(data.buyAmount / 1e6)
  return Number(data.buyAmount / 1e6).toFixed(4);
}

getTokenPriceFromApi('0x0F0BDEbF0F83cD1EE3974779Bcb7315f9808c714', 18)


