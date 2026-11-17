import {cleanupAssets} from '../src/lib/storage/assets';
cleanupAssets(!process.argv.includes('--apply')).then(r=>console.log(JSON.stringify(r))).catch(e=>{console.error(e.message);process.exitCode=1;});
