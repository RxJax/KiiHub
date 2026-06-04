const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');
  const tokens = {
    USDC: "0xc9C3DaE87b18C0E4CEedeEF8e161Cd67d3bEE395",
    USDT: "0xA13A30Aa918C43C463b3Ea3c3b53DDc0646510C9",
    wBTC: "0x3495125a90fFD5c9301FAd2C61f637d0C317C826",
    sKII: "0xc150f249A847b28f579fdA1984e81a494b9E262F"
  };

  const abi = ["function decimals() view returns (uint8)"];

  for (const [symbol, address] of Object.entries(tokens)) {
    const contract = new ethers.Contract(address, abi, provider);
    const decimals = await contract.decimals().catch(() => 18);
    console.log(`${symbol}: decimals = ${decimals}`);
  }
}

main().catch(console.error);
