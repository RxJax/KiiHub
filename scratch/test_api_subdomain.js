async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${url} -> status: ${res.status}`);
  } catch (e) {
    console.log(`${url} -> error: ${e.message}`);
  }
}

async function main() {
  const subdomains = [
    'https://api.kiichain.io',
    'https://api-testnet.kiichain.io',
    'https://explorer-api.kiichain.io',
    'https://api.uno.sentry.testnet.v3.kiivalidator.com',
    'https://api.dos.sentry.testnet.v3.kiivalidator.com',
    'https://explorer.kiichain.io/api-docs'
  ];
  for (const url of subdomains) {
    await checkUrl(url);
  }
}

main().catch(console.error);
