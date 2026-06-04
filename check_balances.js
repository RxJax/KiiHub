const { ethers } = require('ethers');

const RPC_URL = 'https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/';
const USER_ADDRESS = '0x52370A367a76D65cCA9a20aA9aE4C7d092683B9a';

const POOLS = {
  USDC: '0xc9C3DaE87b18C0E4CEedeEF8e161Cd67d3bEE395',
  USDT: '0xA13A30Aa918C43C463b3Ea3c3b53DDc0646510C9',
  wBTC: '0x3495125a90fFD5c9301FAd2C61f637d0C317C826'
};

const ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  for (const [name, tokenAddr] of Object.entries(POOLS)) {
    try {
      const contract = new ethers.Contract(tokenAddr, ABI, provider);
      const dec = await contract.decimals().catch(() => 18);
      const bal = await contract.balanceOf(USER_ADDRESS);
      console.log(`[${name}] Balance: ${ethers.formatUnits(bal, dec)}`);
    } catch (err) {
      console.log(`[${name}] Failed to get balance:`, err.message);
    }
  }
}

main().catch(console.error);
