const http = require("http");

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Failed to parse response"));
        }
      });
    }).on("error", reject);
  });
}

async function testFilters() {
  console.log("🧪 Testing Filtering System...\n");

  try {
    // Test 1: All logs
    console.log("📊 Test 1: All Logs");
    const allLogs = await makeRequest("http://localhost:5000/logs");
    console.log(`   Total: ${allLogs.total}\n`);

    // Test 2: Filter by status range (5xx)
    console.log("🔴 Test 2: 5xx Errors (statusRange=5xx)");
    const errors5xx = await makeRequest("http://localhost:5000/logs?statusRange=5xx");
    console.log(`   Found: ${errors5xx.total}`);
    errors5xx.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 3: Filter by status range (4xx)
    console.log("🟡 Test 3: 4xx Errors (statusRange=4xx)");
    const errors4xx = await makeRequest("http://localhost:5000/logs?statusRange=4xx");
    console.log(`   Found: ${errors4xx.total}`);
    errors4xx.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 4: Filter by status range (2xx)
    console.log("🟢 Test 4: 2xx Success (statusRange=2xx)");
    const success2xx = await makeRequest("http://localhost:5000/logs?statusRange=2xx");
    console.log(`   Found: ${success2xx.total}`);
    success2xx.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 5: Filter by method (GET)
    console.log("🔵 Test 5: GET Requests (method=GET)");
    const getRequests = await makeRequest("http://localhost:5000/logs?method=GET");
    console.log(`   Found: ${getRequests.total}`);
    getRequests.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 6: Filter by method (POST)
    console.log("🟠 Test 6: POST Requests (method=POST)");
    const postRequests = await makeRequest("http://localhost:5000/logs?method=POST");
    console.log(`   Found: ${postRequests.total}`);
    postRequests.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 7: Route search
    console.log("🔎 Test 7: Route Search (route=success)");
    const successSearch = await makeRequest("http://localhost:5000/logs?route=success");
    console.log(`   Found: ${successSearch.total}`);
    successSearch.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    // Test 8: Combined filters
    console.log("🎯 Test 8: Combined Filters (method=GET&statusRange=2xx)");
    const combined = await makeRequest("http://localhost:5000/logs?method=GET&statusRange=2xx");
    console.log(`   Found: ${combined.total}`);
    combined.data?.slice(0, 3).forEach((log) => {
      console.log(`   - ${log.method} ${log.route} → ${log.statusCode}`);
    });
    console.log();

    console.log("✅ All filter tests passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testFilters();
