async function main() {
  const url = 'https://explorer.kiichain.io/api-docs';
  try {
    const res = await fetch(url);
    const text = await res.text();
    console.log('HTML length:', text.length);
    // Find Swagger or API paths using regex
    const matches = text.match(/url:\s*['"][^'"]*['"]/g) || [];
    console.log('JSON spec files matches:', matches);
    const swaggerUrl = text.match(/swagger[^'"]*\.json/i) || text.match(/\/api\/v2\/swagger\.json/) || [];
    console.log('Swagger matches:', swaggerUrl);
    // Print first 1000 characters
    console.log(text.slice(0, 1000));
  } catch (e) {
    console.error('Error:', e.message);
  }
}

main().catch(console.error);
