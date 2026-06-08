import type { InspectionResponse, Severity, TemplateItem } from '@prisma/client';
type R=Pick<InspectionResponse,'templateItemId'|'isCompleted'|'severity'>;
export function progress(items:Pick<TemplateItem,'id'|'isRequired'|'isActive'>[], responses:R[]){const req=items.filter(i=>i.isActive&&i.isRequired); if(!req.length) return 100; const done=req.filter(i=>responses.some(r=>r.templateItemId===i.id&&r.isCompleted)).length; return Math.round((done/req.length)*100)}
export function missingRequired(items:Pick<TemplateItem,'id'|'title'|'isRequired'|'isActive'>[], responses:R[]){return items.filter(i=>i.isActive&&i.isRequired&&!responses.some(r=>r.templateItemId===i.id&&r.isCompleted))}
export function severityCounts(responses:Pick<InspectionResponse,'severity'>[]){return responses.reduce((a,r)=>{a[r.severity]=(a[r.severity]??0)+1;return a},{} as Record<Severity,number>)}
export const isIssue=(s:Severity)=>['LOW','MEDIUM','HIGH','CRITICAL'].includes(s);
export function displayValue(value:unknown){if(value==null)return 'Not captured'; if(Array.isArray(value))return value.join(', '); if(typeof value==='object'&&'value' in value) return String((value as {value:unknown}).value); return String(value)}
