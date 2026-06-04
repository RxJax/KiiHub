async function main() {
  const developerWallet = '0x66A635D839bd99AcA93647B53B43C4d3a16Ea541';
  // BlockScout API URL
  const url = `https://explorer.kiichain.io/api?module=account&action=txlist&address=${developerWallet}&offset=20&page=1&sort=desc`;
  console.log('Fetching developer wallet txlist from:', url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Status:', data.status);
    console.log('Message:', data.message);
    if (data.result && Array.isArray(data.result)) {
      console.log(`Found ${data.result.length} transactions:`);
      for (let i = 0; i < Math.min(data.result.length, 5); i++) {
        const tx = data.result[i];
        console.log(`Tx ${i}: hash=${tx.hash}, from=${tx.from}, value=${tx.value}, time=${new Date(tx.timeStamp * 1000).toISOString()}`);
      }
    } else {
      console.log('Result:', data.result);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
