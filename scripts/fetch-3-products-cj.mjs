import https from "https";
import fs from "fs";

const token = "API@CJ5869406@CJ:eyJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI1MjkwNiIsInR5cGUiOiJBQ0NFU1NfVE9LRU4iLCJzdWIiOiJicUxvYnFRMGxtTm55UXB4UFdMWnlvY3Q5bklaTGtpNDV2Q3MwWUNZV2dNZ2tMNW9NVUpjNEJRSjF0V2tEdEYxcE42QmRybUI3VWNuaXRaZkZrNHNuOHZ4TUwyK3BmOEJ2YjBGRXR3NUMxYWZFOUFhTjJIVUx1S1RUTVFhR2NadVZuVkpZWkNvMlNkRGRLcTN4L1RwQkpWM2R0UlUwazBpcFcyYVpqYzJ1TTBybUxVODhnU2RzSFhZVm9TKy95aVE1K3VXNDI0UlhUK2JHZlc3TDNqZ3czQ096WlM5ZG1qSzE3MzVYV0pmLytEc0F0aE9qa0FvSWl4NlZCNDkyK0JXbmNRaHMrNXIrUmQ3YVEzcGhteVpEU01WMmE2ZU9pT3hLZ2poalduRWJGRGRDbCtER3RmNjNXSUFTOHVrK2M2eiIsImlhdCI6MTc5MDc4Nzg5NX0.kUbKgvPiAYgCF6aJkFkfog5F85OadFHDSyMICHohkvQ";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cjGet(endpoint) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "developers.cjdropshipping.com",
        path: "/api2.0/v1" + endpoint,
        method: "GET",
        headers: {
          "CJ-Access-Token": token,
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

async function run() {
  const pids = [
    { pid: "1400373060946759680", category: "Custom Photo Art" },
    { pid: "1610108055390269440", category: "Gift Keepsakes" },
    { pid: "1618814333893488640", category: "Gift Keepsakes" },
  ];

  const results = [];

  for (const item of pids) {
    console.log("Fetching PID:", item.pid);
    const res = await cjGet("/product/query?pid=" + item.pid);
    if (res.result) {
      results.push({ ...item, cjData: res.data });
      console.log("Successfully fetched:", res.data.productNameEn || res.data.productName);
    } else {
      console.error("Failed for", item.pid, res.message || res);
    }
    await sleep(2000);
  }

  fs.writeFileSync("scripts/cj_3_products_raw.json", JSON.stringify(results, null, 2), "utf8");
  console.log("Saved raw CJ data to scripts/cj_3_products_raw.json");
}

run();
