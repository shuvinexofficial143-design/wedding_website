import { Pool } from "pg";
import { assertPreviewMigrationTarget, migrateFreshPreviewSchema } from "../src/lib/database/preview-migration";

async function main() {
  const url=assertPreviewMigrationTarget(process.env);
  const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:12000});
  try {
    const client=await pool.connect();
    try {
      const result=await migrateFreshPreviewSchema(client);
      console.log(JSON.stringify({
        environment:"preview",branch:"feature/advanced-card-studio",
        created:result.created,connected:result.connected,
        publicTables:result.tableCount,migrationVersion:result.version,
        // Counts only, no connection details, hostnames, credentials or row data.
        emptyUserTables:Object.entries(result.counts).every(([t,n])=>
          t==="schema_migrations" ? n===1 : n===0),
      }));
    } finally {client.release();}
  } finally {await pool.end();}
}
main().catch(error=>{
  console.error("Preview migration aborted:", (error as Error).message);
  process.exitCode=1;
});
