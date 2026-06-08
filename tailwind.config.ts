import type { Config } from 'tailwindcss';
export default {content:['./app/**/*.{ts,tsx}','./components/**/*.{ts,tsx}','./lib/**/*.{ts,tsx}'],theme:{extend:{colors:{navy:'#071b3a',bank:'#0a2f5f',safe:'#16745b',warning:'#b7791f',critical:'#b42318'},boxShadow:{soft:'0 12px 32px rgba(7,27,58,.08)'}}},plugins:[]} satisfies Config;
