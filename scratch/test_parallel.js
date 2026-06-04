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

  const maxBlocks = 30000;
  const chunkSize = 10000;
  const promises = [];

  const startTime = Date.now();

  for (let offset = 0; offset < maxBlocks; offset += chunkSize) {
    const toBlock = blockHeight - offset;
    const fromBlock = Math.max(0, toBlock - chunkSize + 1);
    
    const filter = {
      address: [routerAddress, skiiPoolAddress],
      fromBlock,
      toBlock,
      topics: [[event1, event2, event3, event4]]
    };

    console.log(`Queueing chunk: ${fromBlock}-${toBlock}`);

    promises.push(
      Promise.race([
        provider.getLogs(filter),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`RPC logs Timeout for ${fromBlock}-${toBlock}`)), 3000))
      ]).catch(err => {
        console.error(`Chunk ${fromBlock}-${toBlock} failed:`, err.message);
        return [];
      })
    );
  }

  const results = await Promise.all(promises);
  const allLogs = results.flat();
  console.log(`Parallel fetch completed in ${Date.now() - startTime}ms. Found ${allLogs.length} logs.`);
}

main().catch(console.error);
