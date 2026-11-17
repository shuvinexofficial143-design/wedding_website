/** Convert only unquoted placeholders; values are always bound, never interpolated. */
export function postgresSql(sql:string){let quoted=false;let count=0;let out='';for(let i=0;i<sql.length;i++){const ch=sql[i];if(ch==="'"){out+=ch;if(quoted&&sql[i+1]==="'"){out+=sql[++i];continue;}quoted=!quoted;}else out+=ch==='?'&&!quoted?`$${++count}`:ch;}return out;}
export type SqlValue=string|number|null|Uint8Array;
export type Row=Record<string,unknown>;
export interface Connection {query(sql:string,params?:SqlValue[]):Promise<{rows:Row[];rowCount:number|null}>;}
