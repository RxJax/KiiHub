const http = require("http");

const postData = JSON.stringify({
  address: "0x1234567890123456789012345678901234567890",
  name: "TestBuilderEarningXP",
  avatar: "🔥",
  title: "Explorer",
  level: 3,
  xp: 450,
  contracts: 2
});

const options = {
  hostname: "127.0.0.1",
  port: 3000,
  path: "/api/leaderboard",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(postData)
  }
};

console.log("Sending POST to /api/leaderboard...");
const req = http.request(options, (res) => {
  console.log("Status Code:", res.statusCode);
  
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log("Response:", data);
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error("Request failed:", e.message);
  process.exit(1);
});

req.write(postData);
req.end();
