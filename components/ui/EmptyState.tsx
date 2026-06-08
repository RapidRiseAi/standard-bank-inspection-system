import { Inbox } from 'lucide-react';
export function EmptyState({title,body}:{title:string;body:string}){return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Inbox className="mx-auto mb-3 text-slate-400"/><h3 className="font-bold text-slate-900">{title}</h3><p className="mt-1 text-sm text-slate-500">{body}</p></div>}
