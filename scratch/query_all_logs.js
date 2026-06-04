const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');
  const blockHeight = await provider.getBlockNumber();
  console.log('Current block height:', blockHeight);

  const routerAddress = '0x26DF8853e4a25Ad215D886C0052E1203F8b9dd92';
  const skiiPoolAddress = '0x234FAE5cc64b81826452A28BE0eb6aC530044C01';
  
  const event1 = ethers.id('AssetSwappedToKii(address,address,uint256,uint256)');
  const event2 = ethers.id('AssetSwappedToToken(address,address,uint256,uint256)');
  const event3 = ethers.id('SwappedKiiForToken(address,uint256,uint256)');
  const event4 = ethers.id('SwappedTokenForKii(address,uint256,uint256)');

  const maxBlocks = 60000;
  const chunkSize = 10000;
  let allLogs = [];

  for (let offset = 0; offset < maxBlocks; offset += chunkSize) {
    const toBlock = blockHeight - offset;
    const fromBlock = Math.max(0, toBlock - chunkSize + 1);
    
    const filter = {
      address: [routerAddress, skiiPoolAddress],
      fromBlock,
      toBlock,
      topics: [[event1, event2, event3, event4]]
    };

    try {
      const logs = await provider.getLogs(filter);
      allLogs = allLogs.concat(logs);
      console.log(`Block range ${fromBlock}-${toBlock}: Found ${logs.length} logs. Total: ${allLogs.length}`);
      if (allLogs.length >= 25) {
        break;
      }
    } catch (e) {
      console.error(`Error querying chunk:`, e.message);
      break;
    }
  }

  console.log('Total logs found:', allLogs.length);
  for (let i = 0; i < Math.min(allLogs.length, 25); i++) {
    const log = allLogs[i];
    console.log(`Log ${i}: block=${log.blockNumber}, address=${log.address}, txHash=${log.transactionHash}`);
  }
}

main().catch(console.error);
