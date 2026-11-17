import {migratePostgres,postgresPool} from '../src/lib/database/postgres';
if (process.env.VERCEL === "1") {
  console.error("Hosted migrations must use the protected db:migrate:preview command; generic migration disabled on Vercel.");
  process.exit(1);
}
migratePostgres().then(()=>console.log('PostgreSQL schema migration complete.')).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>postgresPool().end());
