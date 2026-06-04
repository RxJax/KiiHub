async function main() {
  const developerWallet = '0x66A635D839bd99AcA93647B53B43C4d3a16Ea541';
  // BlockScout v2 API URL
  const url = `https://explorer.kiichain.io/api/v2/addresses/${developerWallet}/transactions`;
  console.log('Fetching developer wallet transactions from v2 API:', url);
  
  try {
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response preview:', text.slice(0, 500));
    const data = JSON.parse(text);
    if (data.items && Array.isArray(data.items)) {
      console.log(`Found ${data.items.length} items:`);
      for (let i = 0; i < Math.min(data.items.length, 5); i++) {
        const item = data.items[i];
        console.log(`Item ${i}: hash=${item.hash}, from=${item.from?.hash}, value=${item.value}, time=${item.timestamp}`);
      }
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
