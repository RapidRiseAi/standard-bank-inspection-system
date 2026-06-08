'use client';
import { createContext, useContext, useState } from 'react';
const C=createContext<(m:string)=>void>(()=>{});
export function ToastProvider({children}:{children:React.ReactNode}){const [msg,setMsg]=useState(''); const toast=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(''),2600)}; return <C.Provider value={toast}>{children}{msg&&<div className="fixed bottom-24 left-4 right-4 z-50 rounded-xl bg-navy px-4 py-3 text-center font-semibold text-white shadow-soft md:left-auto md:w-96">{msg}</div>}</C.Provider>}
export const useToast=()=>useContext(C);
