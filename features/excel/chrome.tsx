import {useState} from 'react';
import {Save,Undo2,Redo2,FolderOpen,FilePlus2,Download,Grid3X3,Copy,Plus,Table2} from 'lucide-react';
import {RibbonButton} from '@/shared/editor/ribbon-button';

type Props={title:string;dirty:boolean;canUndo:boolean;canRedo:boolean;onNew:()=>void;onOpen:()=>void;onSave:()=>void;onSaveAs:()=>void;onUndo:()=>void;onRedo:()=>void;onCopy:()=>void;onAddSheet:()=>void;onManager:()=>void};

export function ExcelChrome(p:Props){
  const [tab,setTab]=useState('Home');
  const [collapsed,setCollapsed]=useState(false);
  return <>
    <header className="excel-titlebar">
      <div className="excel-quick-access">
        <button title="Save (Ctrl+S)" aria-label="Save" onClick={p.onSave}><Save size={16}/></button>
        <button title="Undo" aria-label="Undo" disabled={!p.canUndo} onClick={p.onUndo}><Undo2 size={16}/></button>
        <button title="Redo" aria-label="Redo" disabled={!p.canRedo} onClick={p.onRedo}><Redo2 size={16}/></button>
      </div>
      <div className="excel-window-title" title={p.title}>{p.title}{p.dirty?' •':''}<span> — Sku Excel</span></div>
      <button className="excel-manager" onClick={p.onManager} title="Open Office Manager"><Grid3X3 size={15}/> Office</button>
    </header>
    <nav className="excel-ribbon-tabs" aria-label="Excel ribbon">
      {['File','Home','Insert','View'].map(name=><button key={name} aria-pressed={tab===name} className={tab===name?'selected':''} onClick={()=>{setTab(name);setCollapsed(false)}}>{name}</button>)}
      <button className="excel-collapse" aria-label={collapsed?'Expand ribbon':'Collapse ribbon'} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)}>{collapsed?'⌄':'⌃'}</button>
    </nav>
    {!collapsed&&<div className="excel-ribbon">
      {tab==='File'?<>
        <div className="ribbon-group"><RibbonButton icon={FilePlus2} label="New" onClick={p.onNew}/><RibbonButton icon={FolderOpen} label="Open" onClick={p.onOpen}/><span className="group-label">Workbook</span></div>
        <div className="ribbon-group"><RibbonButton icon={Save} label="Save" onClick={p.onSave}/><RibbonButton icon={Download} label="Save as" onClick={p.onSaveAs}/><span className="group-label">Save</span></div>
      </>:tab==='Home'?<>
        <div className="ribbon-group"><RibbonButton icon={Copy} label="Copy" onClick={p.onCopy}/><span className="group-label">Clipboard</span></div>
        <div className="ribbon-group"><RibbonButton icon={Undo2} label="Undo" disabled={!p.canUndo} onClick={p.onUndo}/><RibbonButton icon={Redo2} label="Redo" disabled={!p.canRedo} onClick={p.onRedo}/><span className="group-label">Editing</span></div>
        <div className="ribbon-group"><RibbonButton icon={Plus} label="New sheet" onClick={p.onAddSheet}/><span className="group-label">Cells</span></div>
      </>:tab==='Insert'?<div className="ribbon-group"><RibbonButton icon={Table2} label="New sheet" onClick={p.onAddSheet}/><span className="group-label">Sheets</span></div>
        :<div className="ribbon-group"><RibbonButton icon={Grid3X3} label="Office" onClick={p.onManager}/><span className="group-label">Windows</span></div>}
    </div>}
  </>;
}
