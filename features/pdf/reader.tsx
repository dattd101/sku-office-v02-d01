'use client';
import {useEffect,useState} from 'react';
import {invoke} from '@tauri-apps/api/core';
import {FileText,FolderOpen} from 'lucide-react';
import './styles.css';

/** PDF viewer isolated from editable Word/Excel/PowerPoint features. */
export function PdfReader({sessionId,path}:{sessionId:string;path:string|null}) {
  const [url,setUrl]=useState<string|null>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    let alive=true;
    let objectUrl:string|null=null;
    invoke<number[]>('read_pdf_session',{id:sessionId}).then(bytes=>{
      if(!alive)return;
      const blob=new Blob([new Uint8Array(bytes)],{type:'application/pdf'});
      objectUrl=URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(e=>{if(alive)setError(String(e))});
    return()=>{alive=false;if(objectUrl)URL.revokeObjectURL(objectUrl)};
  },[sessionId]);
  const filename=path?.split(/[\\/]/).pop()??'Document.pdf';
  return <main className="pdf-reader">
    <header className="pdf-header"><div><FileText size={22}/><strong>PDF Reader</strong><span title={path??''}>{filename}</span><small>Read only</small></div>
      <button onClick={()=>void invoke('focus_manager')}><FolderOpen size={16}/> Manager</button>
    </header>
    {error?<section className="pdf-message" role="alert">Unable to read PDF: {error}</section>:
      url?<iframe title={filename} className="pdf-frame" src={url}/>:
      <section className="pdf-message">Loading PDF…</section>}
  </main>;
}
