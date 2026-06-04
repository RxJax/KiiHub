const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');
  const address = '0x52370a367a76d65cca9a20aa9ae4c7d092683b9a';
  
  try {
    const balance = await provider.getBalance(address);
    console.log(`Balance of ${address}: ${ethers.formatEther(balance)} KII`);
  } catch (error) {
    console.error('Error fetching balance:', error);
  }
}

main();
