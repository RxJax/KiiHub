const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://json-rpc.dos.sentry.testnet.v3.kiivalidator.com/');

  const routerAddress = '0x26DF8853e4a25Ad215D886C0052E1203F8b9dd92';
  const skiiPoolAddress = '0x234FAE5cc64b81826452A28BE0eb6aC530044C01';
  
  const event1 = ethers.id('AssetSwappedToKii(address,address,uint256,uint256)');
  const event2 = ethers.id('AssetSwappedToToken(address,address,uint256,uint256)');
  const event3 = ethers.id('SwappedKiiForToken(address,uint256,uint256)');
  const event4 = ethers.id('SwappedTokenForKii(address,uint256,uint256)');

  const targetHashes = [
    '0x4848315a9954251f57bf3525bd3b46dd4c4bdcdb93f7e9f089a24d6878319668',
    '0x9c9625c9b3e36f0275278810ac68f08bc302db814d1b7c8f5de10af985f66d05',
    '0x2f52c517308693dbf1f2aca3bf69bdbcd8ecf4c3b08e606a588a3354b00d225b',
    '0xfd05aaae85a16d3dba6455de7ec73426e35ef682b1a59244f1630daea43bee11',
    '0xaf975db913867d21c2a2e3d34d8afdc38f7c578c8ba293b3540c6eda666c0cd7',
    '0xd945710d1e6bbdd2109326e4a7ef5bb827ebc6085692dfde33a862cf04c0e775'
  ];

  const abiCoder = ethers.AbiCoder.defaultAbiCoder();

  for (const txHash of targetHashes) {
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      console.log(`No receipt for ${txHash}`);
      continue;
    }
    console.log(`\nTransaction: ${txHash}`);
    console.log(`Block Number: ${receipt.blockNumber}`);

    for (const log of receipt.logs) {
      const topic = log.topics[0];
      if (log.address.toLowerCase() === routerAddress.toLowerCase()) {
        if (topic === event1) {
          const user = ethers.getAddress('0x' + log.topics[1].slice(26));
          const token = ethers.getAddress('0x' + log.topics[2].slice(26));
          const [tokensSpent, kiiReceived] = abiCoder.decode(['uint256', 'uint256'], log.data);
          console.log(`  Event: AssetSwappedToKii`);
          console.log(`    User: ${user}`);
          console.log(`    Token: ${token}`);
          console.log(`    Tokens Spent: ${ethers.formatEther(tokensSpent)}`);
          console.log(`    Kii Received: ${ethers.formatEther(kiiReceived)}`);
        } else if (topic === event2) {
          const user = ethers.getAddress('0x' + log.topics[1].slice(26));
          const token = ethers.getAddress('0x' + log.topics[2].slice(26));
          const [kiiSpent, tokensReceived] = abiCoder.decode(['uint256', 'uint256'], log.data);
          console.log(`  Event: AssetSwappedToToken`);
          console.log(`    User: ${user}`);
          console.log(`    Token: ${token}`);
          console.log(`    Kii Spent: ${ethers.formatEther(kiiSpent)}`);
          console.log(`    Tokens Received: ${ethers.formatEther(tokensReceived)}`);
        }
      } else if (log.address.toLowerCase() === skiiPoolAddress.toLowerCase()) {
        if (topic === event3) {
          const user = ethers.getAddress('0x' + log.topics[1].slice(26));
          const [kiiAmount, tokenAmount] = abiCoder.decode(['uint256', 'uint256'], log.data);
          console.log(`  Event: SwappedKiiForToken`);
          console.log(`    User: ${user}`);
          console.log(`    Kii Amount: ${ethers.formatEther(kiiAmount)}`);
          console.log(`    Token Amount: ${ethers.formatEther(tokenAmount)}`);
        } else if (topic === event4) {
          const user = ethers.getAddress('0x' + log.topics[1].slice(26));
          const [tokenAmount, kiiAmount] = abiCoder.decode(['uint256', 'uint256'], log.data);
          console.log(`  Event: SwappedTokenForKii`);
          console.log(`    User: ${user}`);
          console.log(`    Token Amount: ${ethers.formatEther(tokenAmount)}`);
          console.log(`    Kii Amount: ${ethers.formatEther(kiiAmount)}`);
        }
      }
    }
  }
}

main().catch(console.error);
