'use client';
import {useState} from 'react';
import Editor from './editor';
import {addSheet} from './actions';
import type {EditorFeature, EditorProps} from '@/shared/editor/types';

export function useExcelEditor(props: EditorProps): EditorFeature {
  const [selectedCell, setSelectedCell] = useState('1:0');
  const sheet = props.doc.sheets[props.doc.selected_sheet] ?? props.doc.sheets[0];
  return {
    name: 'Excel', extension: 'xlsx',
    content: <Editor {...props} selectedCell={selectedCell} setSelectedCell={setSelectedCell}/>,
    clipboardText: sheet?.cells[selectedCell] ?? '',
    status: props.doc.sheets.length + ' sheet(s)',
    insertLabel: 'New sheet', insert: () => props.update(addSheet),
  };
}
