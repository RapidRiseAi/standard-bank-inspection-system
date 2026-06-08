import type { Severity } from '@prisma/client';
const map={NONE:'bg-slate-100 text-slate-600',LOW:'bg-green-100 text-green-800',MEDIUM:'bg-amber-100 text-amber-800',HIGH:'bg-orange-100 text-orange-800',CRITICAL:'bg-red-100 text-red-800'} as const;
export function SeverityBadge({severity}:{severity:Severity|string}){return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${map[(severity as Severity)]??map.NONE}`}>{String(severity).replace('_',' ')}</span>}
