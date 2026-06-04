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

  const POOL_REGISTRY = {
    USDC: {
      tokenAddress: "0xc9C3DaE87b18C0E4CEedeEF8e161Cd67d3bEE395",
      poolAddress: routerAddress,
    },
    USDT: {
      tokenAddress: "0xA13A30Aa918C43C463b3Ea3c3b53DDc0646510C9",
      poolAddress: routerAddress,
    },
    wBTC: {
      tokenAddress: "0x3495125a90fFD5c9301FAd2C61f637d0C317C826",
      poolAddress: routerAddress,
    },
    sKII: {
      tokenAddress: "0xc150f249A847b28f579fdA1984e81a494b9E262F",
      poolAddress: "0x234FAE5cc64b81826452A28BE0eb6aC530044C01",
    },
  };

  const reverseTokenMap = {};
  Object.entries(POOL_REGISTRY).forEach(([symbol, info]) => {
    reverseTokenMap[info.tokenAddress.toLowerCase()] = symbol;
  });

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
      if (allLogs.length >= 25) {
        break;
      }
    } catch (e) {
      console.error(`Error querying chunk:`, e.message);
      break;
    }
  }

  console.log('Total logs found:', allLogs.length);
  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  for (let i = 0; i < allLogs.length; i++) {
    const log = allLogs[i];
    try {
      const topic = log.topics[0];
      if (!log.topics[1]) {
        console.log(`Log ${i} has no topics[1]! topics:`, log.topics);
        continue;
      }
      const userAddress = ethers.getAddress('0x' + log.topics[1].slice(26));
      const blockTimestamp = Date.now() - (blockHeight - Number(log.blockNumber)) * 2000;

      let fromToken = "";
      let toToken = "";
      let fromAmount = 0;
      let toAmount = 0;

      if (log.address.toLowerCase() === routerAddress.toLowerCase()) {
        if (!log.topics[2]) {
          console.log(`Log ${i} on router has no topics[2]! topics:`, log.topics);
          continue;
        }
        const tokenAddress = ethers.getAddress('0x' + log.topics[2].slice(26));
        const symbol = reverseTokenMap[tokenAddress.toLowerCase()] || "UNKNOWN";

        if (topic === event1) {
          const [tokensSpent, kiiReceived] = abiCoder.decode(['uint256', 'uint256'], log.data);
          fromToken = symbol;
          toToken = "KII";
          fromAmount = Number(ethers.formatEther(tokensSpent));
          toAmount = Number(ethers.formatEther(kiiReceived));
        } else if (topic === event2) {
          const [kiiSpent, tokensReceived] = abiCoder.decode(['uint256', 'uint256'], log.data);
          fromToken = "KII";
          toToken = symbol;
          fromAmount = Number(ethers.formatEther(kiiSpent));
          toAmount = Number(ethers.formatEther(tokensReceived));
        }
      } else if (log.address.toLowerCase() === skiiPoolAddress.toLowerCase()) {
        if (topic === event3) {
          const [kiiAmount, tokenAmount] = abiCoder.decode(['uint256', 'uint256'], log.data);
          fromToken = "KII";
          toToken = "sKII";
          fromAmount = Number(ethers.formatEther(kiiAmount));
          toAmount = Number(ethers.formatEther(tokenAmount));
        } else if (topic === event4) {
          const [tokenAmount, kiiAmount] = abiCoder.decode(['uint256', 'uint256'], log.data);
          fromToken = "sKII";
          toToken = "KII";
          fromAmount = Number(ethers.formatEther(tokenAmount));
          toAmount = Number(ethers.formatEther(kiiAmount));
        }
      }

      console.log(`Log ${i} parsed successfully: txHash=${log.transactionHash}, from=${fromToken}(${fromAmount}) to=${toToken}(${toAmount}) user=${userAddress}`);
    } catch (e) {
      console.error(`Error parsing log ${i}:`, e);
    }
  }
}

main().catch(console.error);
