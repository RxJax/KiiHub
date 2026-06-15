const http = require("http");

console.log("Making request to http://127.0.0.1:3000/api/leaderboard...");
const req = http.get("http://127.0.0.1:3000/api/leaderboard", (res) => {
  console.log("Status Code:", res.statusCode);
  console.log("Headers:", res.headers);
  
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  
  res.on("end", () => {
    console.log("Body:");
    console.log(data);
    process.exit(0);
  });
});

req.on("error", (e) => {
  console.error("Request failed:", e.message);
  process.exit(1);
});

req.end();
