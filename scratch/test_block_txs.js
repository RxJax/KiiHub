const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');
  const latestBlock = await provider.getBlockNumber();
  console.log('Latest block number:', latestBlock);

  // Scan the last 15 blocks
  for (let i = 0; i < 15; i++) {
    const num = latestBlock - i;
    const hexNum = '0x' + num.toString(16);
    try {
      const block = await provider.send("eth_getBlockByNumber", [hexNum, true]);
      if (block && block.transactions && block.transactions.length > 0) {
        console.log(`Block ${num}: Found ${block.transactions.length} transactions`);
        for (const tx of block.transactions) {
          console.log(`  Tx: hash=${tx.hash}, from=${tx.from}, to=${tx.to}, value=${ethers.formatEther(tx.value || '0')} KII`);
        }
      } else {
        console.log(`Block ${num}: 0 transactions`);
      }
    } catch (e) {
      console.error(`Error fetching block ${num} (${hexNum}):`, e.message);
    }
  }
}

main().catch(console.error);
