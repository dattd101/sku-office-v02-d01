import type {Dispatch, ReactNode, SetStateAction} from 'react';
import type {OfficeDocument} from '@/shared/document/types';

export type EditorProps = {
  doc: OfficeDocument;
  update: (updater: (doc: OfficeDocument) => OfficeDocument) => void;
  setDoc: Dispatch<SetStateAction<OfficeDocument>>;
};

// Each feature supplies its own content and commands to the workspace shell.
export type EditorFeature = {
  name: string;
  extension: string;
  content: ReactNode;
  clipboardText: string;
  status: string;
  insertLabel: string;
  insert: () => void;
};
