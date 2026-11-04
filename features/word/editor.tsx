'use client';
import {FileText, Menu} from 'lucide-react';
import type {EditorProps} from '@/shared/editor/types';
export default function Editor({doc,update}:EditorProps){

return (<main className="word-workspace"><aside className="word-sidebar"><div className="sidebar-heading"><Menu size={17}/> Navigation</div><div className="sidebar-muted">DOCUMENT OUTLINE</div><div className="nav-entry active"><FileText size={15}/> Page 1</div><p className="sidebar-help">Write your document on the page. DOCX import/export supports basic paragraph text.</p></aside><div className="word-scroll"><div className="page-ruler"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span></div><section className="paper"><textarea aria-label="Word document" placeholder="Start writing your document…" spellCheck value={doc.word} onChange={e=>update(d=>({...d,word:e.target.value}))}/></section></div></main>);
}
