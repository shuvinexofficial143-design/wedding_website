/** Neutralize spreadsheet formula injection and quote RFC4180 cells. */
export function csvCell(value:unknown){const s=String(value??'');return '"'+(/^[\s]*[=+@\-\t\r]/.test(s)?"'":'')+s.replaceAll('"','""')+'"';}
