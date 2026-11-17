import { Pool } from "pg";
import { assertPreviewMigrationTarget, verifyPreviewSchema } from "../src/lib/database/preview-migration";
async function main() {
  const url=assertPreviewMigrationTarget(process.env);
  const pool=new Pool({connectionString:url,max:1,connectionTimeoutMillis:12000});
  try {
    const client=await pool.connect();
    try {
      await client.query("BEGIN READ ONLY");
      try {
        const result=await verifyPreviewSchema(client);
        console.log(JSON.stringify({environment:"preview",connected:result.connected,
          publicTables:result.tableCount,migrationVersion:result.version,
          recordCounts:result.counts}));
      } finally {await client.query("ROLLBACK");}
    } finally {client.release();}
  } finally {await pool.end();}
}
main().catch(error=>{console.error("Preview verification failed:",(error as Error).message);process.exitCode=1;});
