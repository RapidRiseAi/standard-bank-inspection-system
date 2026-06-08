import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';
export const metadata:Metadata={title:'BuildInspect Demo',description:'Mobile-first building inspection management system'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ToastProvider>{children}</ToastProvider></body></html>}
