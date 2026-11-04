'use client';
import {Table2, ChevronDown, Plus} from 'lucide-react';
import {addSheet} from './actions';
import type {EditorProps} from '@/shared/editor/types';
export default function Editor({doc,update,setDoc,selectedCell,setSelectedCell,}:EditorProps & {selectedCell:string;setSelectedCell:(key:string)=>void}){
const colName=(i:number)=>{let s='';for(let n=i+1;n>0;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s};
 const sheet=doc.sheets[doc.selected_sheet]??doc.sheets[0];
 const formula=sheet?.cells[selectedCell]??'';
 const setCell=(key:string,value:string)=>update(d=>({...d,sheets:d.sheets.map((s,i)=>i===d.selected_sheet?{...s,cells:{...s.cells,[key]:value}}:s)}));
return (<main className="excel-workspace"><div className="formula-bar"><div className="name-box">{colName(Number(selectedCell.split(':')[1]))}{Number(selectedCell.split(':')[0])+1}<ChevronDown size={14}/></div><span className="fx">ƒx</span><input aria-label="Formula bar" value={formula} onChange={e=>setCell(selectedCell,e.target.value)} placeholder="Enter a value or formula"/></div><div className="sheet-scroll"><table className="sheet-table"><thead><tr><th className="corner"></th>{Array.from({length:22},(_,c)=><th key={c}>{colName(c)}</th>)}</tr></thead><tbody>{Array.from({length:70},(_,r)=><tr key={r}><th>{r+1}</th>{Array.from({length:22},(_,c)=>{const key=`${r}:${c}`;return <td key={key} className={selectedCell===key?'cell-selected':''}><input aria-label={`Cell ${colName(c)}${r+1}`} value={sheet?.cells[key]??''} onFocus={()=>setSelectedCell(key)} onChange={e=>setCell(key,e.target.value)}/></td>})}</tr>)}</tbody></table></div><div className="sheet-tabs">{doc.sheets.map((s,i)=><button key={i} className={i===doc.selected_sheet?'active':''} onClick={()=>setDoc(d=>({...d,selected_sheet:i}))}><Table2 size={14}/>{s.name}</button>)}<button title="Add sheet" onClick={()=>update(addSheet)}><Plus size={17}/></button></div></main>);
}
