'use client';
import {useWordEditor} from '@/features/word/use-editor';
import {useExcelEditor} from '@/features/excel/use-editor';
import {usePowerPointEditor} from '@/features/powerpoint/use-editor';
import type {EditorProps} from '@/shared/editor/types';

export function useActiveEditor(props: EditorProps, newFile: () => void) {
  // Keep hook order stable; only the active feature's content is mounted.
  const word = useWordEditor(props, newFile);
  const excel = useExcelEditor(props);
  const powerpoint = usePowerPointEditor(props);
  return {word, excel, powerpoint}[props.doc.mode as "word" | "excel" | "powerpoint"] ?? word;
}
