// Test script to verify the fixed status mapping
const mapStatus = (status) => {
  return {
    func: ["Functional", "Working", "Operational"].includes(status) ? "✓" : "",
    rep: status === "For Repair" ? "✓" : "",
    upg: status === "For Upgrade" ? "✓" : "",
    repl: status === "For Replacement" ? "✓" : "",
  };
};

// Test cases
const testCases = [
  "Functional",
  "For Repair", 
  "For Upgrade",
  "For Replacement"
];

console.log("Testing FIXED status mapping function:");
testCases.forEach(status => {
  const result = mapStatus(status);
  console.log(`Status: "${status}" -> func:"${result.func}" rep:"${result.rep}" upg:"${result.upg}" repl:"${result.repl}"`);
});

// Test component structure like in the actual code
const testAsset = {
  unit_name: "Monitor",
  status: "Functional",
  property_tag_no: "TAG001",
  asset_remarks: "Working fine"
};

const statusMap = mapStatus(testAsset.status);
const component = {
  name: testAsset.unit_name,
  func: statusMap.func,
  rep: statusMap.rep,
  upg: statusMap.upg,
  repl: statusMap.repl,
  tag: testAsset.property_tag_no || "N/A",
  remarks: testAsset.asset_remarks || "",
};

console.log("\nSample FIXED component structure:");
console.log(JSON.stringify(component, null, 2));
console.log("\n✅ No more CSS classes - only checkmarks (✓) or empty strings!");
