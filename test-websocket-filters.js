#!/usr/bin/env node
/**
 * WebSocket Filter Test
 * Verifies that filter matching works correctly for real-time events
 */

const io = require("socket.io-client");
const http = require("http");

const API_BASE = "http://localhost:5000";
const TEST_API_BASE = "http://localhost:4000";

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: "GET"
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve(res.statusCode);
      });
    });

    req.on("error", reject);
    req.end();
  });
}

// Filter matching logic from Dashboard component
function matchesFilters(log, filters) {
  // Check status range
  if (filters.statusRange) {
    const statusCode = log.statusCode;
    const range = filters.statusRange.toLowerCase();

    if (range === "2xx" && !(statusCode >= 200 && statusCode < 300)) return false;
    if (range === "4xx" && !(statusCode >= 400 && statusCode < 500)) return false;
    if (range === "5xx" && !(statusCode >= 500 && statusCode < 600)) return false;
  }

  // Check method
  if (filters.method && log.method !== filters.method) return false;

  // Check route
  if (filters.route && !log.route.includes(filters.route)) return false;

  return true;
}

async function runFilterTest() {
  console.log("\n🔍 WebSocket Filter Test\n");

  // Test scenario 1: Filter by status range 5xx
  console.log("Test 1: Filter by 5xx errors");
  console.log("  Expected: Only 500 errors should pass");

  let testPassed = false;
  const filter5xx = { statusRange: "5xx" };

  const socket5xx = io(API_BASE, { transports: ["websocket", "polling"] });

  return new Promise(async (resolve) => {
    socket5xx.on("connect", async () => {
      let logsForTest1 = [];

      socket5xx.on("new_log", (event) => {
        if (matchesFilters(event.data, filter5xx)) {
          logsForTest1.push(event.data);
        }
      });

      try {
        // Send requests that will match and not match the filter
        console.log("\n  Sending requests:");
        console.log("  - GET /success (200 - should NOT match 5xx filter)");
        await makeRequest(`${TEST_API_BASE}/success`);

        console.log("  - GET /fail (500 - should match 5xx filter)");
        await makeRequest(`${TEST_API_BASE}/fail`);

        console.log("  - GET /unauthorized (401 - should NOT match 5xx filter)");
        try {
          await makeRequest(`${TEST_API_BASE}/unauthorized`);
        } catch (e) {}

        await new Promise((r) => setTimeout(r, 2000));

        console.log(`\n  Results: Received ${logsForTest1.length} matching logs`);
        logsForTest1.forEach((log) => {
          console.log(`    ✓ ${log.method} ${log.route} → ${log.statusCode}`);
        });

        if (logsForTest1.length >= 1 && logsForTest1.every((l) => l.statusCode >= 500)) {
          console.log("  ✅ Filter test 1 PASSED\n");
        } else {
          console.log("  ❌ Filter test 1 FAILED\n");
        }

        socket5xx.disconnect();

        // Test scenario 2: Filter by method
        console.log("Test 2: Filter by method (POST)");
        console.log("  Expected: Only POST requests should pass");

        const filterPost = { method: "POST" };
        const socketPost = io(API_BASE, { transports: ["websocket", "polling"] });

        socketPost.on("connect", async () => {
          let logsForTest2 = [];

          socketPost.on("new_log", (event) => {
            if (matchesFilters(event.data, filterPost)) {
              logsForTest2.push(event.data);
            }
          });

          try {
            console.log("\n  Sending requests:");
            console.log("  - GET /success (should NOT match POST filter)");
            await makeRequest(`${TEST_API_BASE}/success`);

            console.log("  - POST /echo (should match POST filter)");
            await makeRequest(`${TEST_API_BASE}/echo`);

            await new Promise((r) => setTimeout(r, 2000));

            console.log(`\n  Results: Received ${logsForTest2.length} matching logs`);
            logsForTest2.forEach((log) => {
              console.log(
                `    ✓ ${log.method} ${log.route} → ${log.statusCode}`
              );
            });

            if (
              logsForTest2.length >= 1 &&
              logsForTest2.every((l) => l.method === "POST")
            ) {
              console.log("  ✅ Filter test 2 PASSED\n");
            } else {
              console.log("  ❌ Filter test 2 FAILED\n");
            }

            socketPost.disconnect();

            // Test scenario 3: Combined filters
            console.log("Test 3: Combined filters (5xx + GET)");
            console.log("  Expected: Only GET requests with 5xx errors");

            const filterCombined = {
              statusRange: "5xx",
              method: "GET"
            };

            const socketCombined = io(API_BASE, {
              transports: ["websocket", "polling"]
            });

            socketCombined.on("connect", async () => {
              let logsForTest3 = [];

              socketCombined.on("new_log", (event) => {
                if (matchesFilters(event.data, filterCombined)) {
                  logsForTest3.push(event.data);
                }
              });

              try {
                console.log("\n  Sending requests:");
                console.log(
                  "  - GET /fail (500 - should match combined filter)"
                );
                await makeRequest(`${TEST_API_BASE}/fail`);

                console.log("  - GET /success (200 - should NOT match)");
                await makeRequest(`${TEST_API_BASE}/success`);

                await new Promise((r) => setTimeout(r, 2000));

                console.log(
                  `\n  Results: Received ${logsForTest3.length} matching logs`
                );
                logsForTest3.forEach((log) => {
                  console.log(
                    `    ✓ ${log.method} ${log.route} → ${log.statusCode}`
                  );
                });

                if (
                  logsForTest3.length >= 1 &&
                  logsForTest3.every(
                    (l) =>
                      l.method === "GET" && l.statusCode >= 500
                  )
                ) {
                  console.log("  ✅ Filter test 3 PASSED\n");
                } else {
                  console.log("  ❌ Filter test 3 FAILED\n");
                }

                socketCombined.disconnect();
                console.log("✅ All WebSocket filter tests completed!\n");
                resolve();
              } catch (err) {
                console.error("❌ Error in test 3:", err.message);
                socketCombined.disconnect();
                resolve();
              }
            });
          } catch (err) {
            console.error("❌ Error in test 2:", err.message);
            socketPost.disconnect();
            resolve();
          }
        });
      } catch (err) {
        console.error("❌ Error in test 1:", err.message);
        socket5xx.disconnect();
        resolve();
      }
    });

    // Timeout
    setTimeout(() => {
      console.log("\n⏱️  Test timeout");
      resolve();
    }, 30000);
  });
}

runFilterTest().then(() => process.exit(0));
