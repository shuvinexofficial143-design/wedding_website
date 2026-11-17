import { deploymentReadiness } from "../src/lib/deployment-readiness";
const result = deploymentReadiness(process.env);
console.log("Wedding Card Studio — hosted environment preflight (no secrets shown)");
console.log(result.ready ? "CONFIGURATION VALID" : "CONFIGURATION INCOMPLETE");
for (const issue of result.errors) console.error("ERROR:", issue);
for (const warning of result.warnings) console.warn("NOTE:", warning);
if (!result.ready) process.exitCode = 1;
