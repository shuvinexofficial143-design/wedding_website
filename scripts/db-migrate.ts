import {migratePostgres,postgresPool} from '../src/lib/database/postgres';
migratePostgres().then(()=>console.log('PostgreSQL schema migration complete.')).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>postgresPool().end());
