'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import type { DocumentSession } from '@/shared/sessions/types';
import { FolderOpen, Save, FilePlus2, Undo2, Redo2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Search, Plus, Download, PanelLeft, Maximize2, Type, LayoutTemplate, Sparkles, Grid3X3, Check, Copy } from 'lucide-react';
import {useActiveEditor} from './use-active-editor';
import {fresh} from '@/workspace/document/create';
import type {OfficeDocument} from '@/shared/document/types';
import {RibbonButton} from '@/shared/editor/ribbon-button';
import {PdfReader} from '@/features/pdf/reader';

const ribbonTabs=['File','Home','Insert','Layout','Review','View'];
export default function Office(){
  const sessionId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("session") : null;
  const [ready,setReady]=useState(false);
  const [loadError,setLoadError]=useState('');
  const latest=useRef<{document:OfficeDocument;path:string|null;dirty:boolean}|null>(null);
  const savedRevision=useRef(0);
  const revision=useRef(0);
  const [doc,setDoc]=useState<OfficeDocument>(()=>fresh());
  const [tab,setTab]=useState('Home');
  const [path,setPath]=useState<string|null>(null);
  const [dirty,setDirty]=useState(false);
  const [message,setMessage]=useState('Ready');
  const [dark,setDark]=useState(false);
  const [zoom,setZoom]=useState(100);
  const [history,setHistory]=useState<OfficeDocument[]>([]);
  const [future,setFuture]=useState<OfficeDocument[]>([]);
  const [search,setSearch]=useState('');
  const mode=doc.mode;
  latest.current={document:doc,path,dirty};
  useEffect(()=>{
    if(!sessionId){setLoadError('Missing session ID in editor URL.');return;}
    let active=true;
    invoke<DocumentSession>('get_session',{id:sessionId}).then(s=>{
      if(!active)return;
      setDoc(s.document);setPath(s.path);setDirty(s.dirty);setReady(true);
      setMessage(s.dirty?'Recovered unsaved changes from local snapshot':'Document ready');
    }).catch(e=>{if(active)setLoadError(`Cannot load document session: ${String(e)}`)});
    return()=>{active=false};
  },[sessionId]);
  useEffect(()=>{
    if(!ready||!sessionId)return;
    const n=++revision.current;
    const timer=setTimeout(()=>{
      if(n!==revision.current||!latest.current)return;
      const {document,path,dirty}=latest.current;
      invoke('snapshot_session',{id:sessionId,document,path,dirty}).then(()=>{savedRevision.current=n}).catch(e=>setMessage(`Recovery snapshot failed: ${String(e)}`));
    },850);
    return()=>clearTimeout(timer);
  },[doc,path,dirty,ready,sessionId]);
  useEffect(()=>{
    if(!sessionId)return;
    let disposed=false;
    let unlisten:(()=>void)|undefined;
    getCurrentWindow().onCloseRequested(async event=>{
      if(!latest.current)return;
      if(latest.current.dirty){
        event.preventDefault();
        const choice=window.confirm('Unsaved edits are kept in Recovery. Close this editor?');
        if(!choice)return;
      }
      const {document,path,dirty}=latest.current;
      try{await invoke('snapshot_session',{id:sessionId,document,path,dirty})}catch(e){console.error(e)}
      await getCurrentWindow().destroy();
    }).then(fn=>{if(disposed)fn();else unlisten=fn});
    return()=>{disposed=true;unlisten?.()};
  },[sessionId]);
  const update=useCallback((updater:(d:OfficeDocument)=>OfficeDocument)=>{
    setDoc(prev=>{const next=updater(prev);if(next===prev)return prev;setHistory(h=>[...h.slice(-29),prev]);setFuture([]);return next});setDirty(true);
  },[]);
  const newFile=async()=>{try{const s=await invoke<DocumentSession>('create_session',{mode});await invoke('open_editor_window',{id:s.id})}catch(e){setMessage(String(e))}};

  const open=async()=>{try{const result=await invoke<DocumentSession|null>('import_session');if(result){await invoke('open_editor_window',{id:result.id});setMessage('Opened in a separate window')}}catch(e){setMessage(`Open failed: ${String(e)}`)}};
  const save=async(as=false)=>{try{if(!sessionId)return;const result=await invoke<string|null>('save_session',{id:sessionId,document:doc,path,saveAs:as});if(result){setPath(result);setDirty(false);setMessage(`Saved ${result}`)}}catch(e){setMessage(`Save failed: ${String(e)}`)}};
  const undo=()=>{if(!history.length)return;const prev=history[history.length-1];setHistory(h=>h.slice(0,-1));setFuture(f=>[...f,doc]);setDoc(prev);setDirty(true)};
  const redo=()=>{if(!future.length)return;const next=future[future.length-1];setFuture(f=>f.slice(0,-1));setHistory(h=>[...h,doc]);setDoc(next);setDirty(true)};
  useEffect(()=>{const handler=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void save(e.shiftKey)}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='o'){e.preventDefault();void open()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='n'){e.preventDefault();newFile()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!(e.target instanceof HTMLTextAreaElement)&&!(e.target instanceof HTMLInputElement)){e.preventDefault();undo()}};window.addEventListener('keydown',handler);return()=>window.removeEventListener('keydown',handler)});
  const feature=useActiveEditor({doc,update,setDoc},()=>void newFile());
  const title=path?.split(/[\\/]/).pop()??`Untitled.${feature.extension}`;
  if(loadError)return <main style={{padding:32,fontFamily:'sans-serif'}}><h1>Unable to open editor</h1><p>{loadError}</p><button onClick={()=>void invoke('focus_manager')}>Return to Manager</button></main>;
  if(!ready)return <main style={{padding:32,fontFamily:'sans-serif'}}><h1>Opening document…</h1><p>Loading local recovery session.</p></main>;
  if(mode==='pdf')return <PdfReader sessionId={sessionId!} path={path}/>;
  return <div className={`app-shell mode-${mode} ${dark?'dark-app':''}`}>
    <header className="titlebar"><div className="brand"><span className="brand-mark"><Grid3X3 size={18}/></span><span>Rust<span className="brand-light">Office</span></span><span className="brand-pill">MODERN</span></div><div className="document-name">{title}{dirty?' •':''}</div><div className="title-actions"><span className="autosave"><Check size={14}/> Desktop workspace</span><button className="icon-button" title="Toggle dark mode" onClick={()=>setDark(!dark)}><Sparkles size={17}/></button></div></header>
    <div className="topbar"><div className="app-switcher"><button className="app-tab" onClick={()=>void invoke('focus_manager')}><Grid3X3 size={17}/> Manager</button><span className="app-tab active">{feature.name}</span></div><div className="quick-actions"><button onClick={newFile}><FilePlus2 size={16}/> New</button><button onClick={()=>void open()}><FolderOpen size={16}/> Open</button><button onClick={()=>void save()}><Save size={16}/> Save</button><button onClick={()=>void save(true)}><Download size={16}/> Save as</button><span className="vertical-rule"/><button className="square" title="Undo" disabled={!history.length} onClick={undo}><Undo2 size={17}/></button><button className="square" title="Redo" disabled={!future.length} onClick={redo}><Redo2 size={17}/></button></div></div>
    <div className="ribbon-tabs">{ribbonTabs.map(t=><button key={t} className={tab===t?'selected':''} onClick={()=>setTab(t)}>{t}</button>)}<div className="ribbon-search"><Search size={15}/><input placeholder="Search commands" value={search} onChange={e=>setSearch(e.target.value)}/></div></div>
    <div className="ribbon-body">{tab==='File'?<><div className="ribbon-group"><RibbonButton icon={FilePlus2} label="New" onClick={newFile}/><RibbonButton icon={FolderOpen} label="Open" onClick={()=>void open()}/><RibbonButton icon={Save} label="Save" onClick={()=>void save()}/><RibbonButton icon={Download} label="Save As" onClick={()=>void save(true)}/><span className="group-label">Document</span></div></>:<>
      <div className="ribbon-group"><RibbonButton icon={Copy} label="Copy" onClick={()=>navigator.clipboard?.writeText(feature.clipboardText)}/><RibbonButton icon={Undo2} label="Undo" onClick={undo} disabled={!history.length}/><RibbonButton icon={Redo2} label="Redo" onClick={redo} disabled={!future.length}/><span className="group-label">Clipboard</span></div>
      <div className="ribbon-group font-group"><div className="font-row"><select aria-label="Font" defaultValue="Aptos"><option>Aptos</option><option>Calibri</option><option>Arial</option><option>Times New Roman</option></select><select aria-label="Font size" defaultValue="12"><option>10</option><option>11</option><option>12</option><option>14</option><option>18</option><option>24</option></select></div><div className="format-row"><button title="Bold" onClick={()=>setMessage('Rich text formatting is planned for a later release')}><Bold size={16}/></button><button title="Italic" onClick={()=>setMessage('Rich text formatting is planned for a later release')}><Italic size={16}/></button><button title="Underline" onClick={()=>setMessage('Rich text formatting is planned for a later release')}><Underline size={16}/></button><span className="vertical-rule"/><button title="Align left"><AlignLeft size={16}/></button><button title="Align center"><AlignCenter size={16}/></button><button title="Align right"><AlignRight size={16}/></button></div><span className="group-label">Font & paragraph</span></div>
      <div className="ribbon-group"><RibbonButton icon={LayoutTemplate} label="Layout" onClick={()=>setTab('Layout')}/><RibbonButton icon={PanelLeft} label="Panels" onClick={()=>setMessage('Panel layout is currently fixed')}/><RibbonButton icon={Maximize2} label="Zoom" onClick={()=>setZoom(z=>z===100?125:100)}/><span className="group-label">View</span></div>
      <div className="ribbon-group"><RibbonButton icon={Type} label="Insert text" onClick={()=>setMessage('Select a text area to type')}/><RibbonButton icon={Plus} label={feature.insertLabel} onClick={feature.insert}/><span className="group-label">Insert</span></div>
    </>}</div>
    {feature.content}
    <footer className="statusbar"><div className="status-left"><span className="status-dot"/>{message.length>110?message.slice(0,110)+'…':message}<span className="status-sep"/>{feature.status}</div><div className="status-right"><span>{dirty?'Recovery snapshot enabled · Not saved to file':'Saved to file'}</span><span className="status-sep"/><button onClick={()=>setZoom(z=>Math.max(60,z-10))}>−</button><input aria-label="Zoom" type="range" min="60" max="150" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><button onClick={()=>setZoom(z=>Math.min(150,z+10))}>+</button><span>{zoom}%</span></div></footer>
  </div>
}
