const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');
  const blockHeight = await provider.getBlockNumber();
  console.log('Current block height:', blockHeight);

  const routerAddress = '0x26DF8853e4a25Ad215D886C0052E1203F8b9dd92';
  
  const event1 = ethers.id('AssetSwappedToKii(address,address,uint256,uint256)');
  const event2 = ethers.id('AssetSwappedToToken(address,address,uint256,uint256)');

  // Let's query multiple chunks of 10,000 blocks backwards
  const maxBlocks = 100000;
  const chunkSize = 10000;
  let allLogs = [];

  for (let offset = 0; offset < maxBlocks; offset += chunkSize) {
    const toBlock = blockHeight - offset;
    const fromBlock = Math.max(0, toBlock - chunkSize + 1);
    console.log(`Querying block range: ${fromBlock} to ${toBlock}...`);
    
    const filter = {
      address: routerAddress,
      fromBlock,
      toBlock,
      topics: [[event1, event2]]
    };

    try {
      const logs = await provider.getLogs(filter);
      allLogs = allLogs.concat(logs);
      console.log(`Found ${logs.length} logs in chunk. Total so far: ${allLogs.length}`);
      if (allLogs.length >= 20) {
        break;
      }
    } catch (e) {
      console.error(`Error querying chunk:`, e.message);
      break;
    }
  }

  console.log('Total logs found:', allLogs.length);
  for (let i = 0; i < Math.min(allLogs.length, 20); i++) {
    const log = allLogs[i];
    console.log(`Log ${i}: block=${log.blockNumber}, txHash=${log.transactionHash}`);
  }
}

main().catch(console.error);
