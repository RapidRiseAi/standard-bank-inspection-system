import type { Role } from '@prisma/client';
export const canManageTemplates=(role?:Role)=>role==='ADMIN';
export const canInspect=(role?:Role)=>role==='ADMIN'||role==='INSPECTOR';
