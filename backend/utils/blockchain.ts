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