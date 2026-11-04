'use client';
import Editor from './editor';
import {addSlide} from './actions';
import type {EditorFeature, EditorProps} from '@/shared/editor/types';

export function usePowerPointEditor(props: EditorProps): EditorFeature {
  const slide = props.doc.slides[props.doc.selected_slide] ?? props.doc.slides[0];
  return {
    name: 'PowerPoint', extension: 'pptx', content: <Editor {...props}/>,
    clipboardText: slide?.title ?? '', status: props.doc.slides.length + ' slide(s)',
    insertLabel: 'New slide', insert: () => props.update(addSlide),
  };
}
