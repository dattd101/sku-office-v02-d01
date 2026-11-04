'use client';
import Editor from './editor';
import type {EditorFeature, EditorProps} from '@/shared/editor/types';

export function useWordEditor(props: EditorProps, newFile: () => void): EditorFeature {
  const text = props.doc.word;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return {
    name: 'Word', extension: 'docx', content: <Editor {...props}/>,
    clipboardText: text, status: words + ' words',
    insertLabel: 'New file', insert: newFile,
  };
}
