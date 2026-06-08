'use client';
import { Button } from './Button';
export function ConfirmDialog({message,onConfirm}:{message:string;onConfirm:()=>void}){return <Button variant="danger" type="button" onClick={()=>{if(confirm(message))onConfirm()}}>Delete</Button>}
