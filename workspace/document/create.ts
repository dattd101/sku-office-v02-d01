import {createWordDefaults} from '@/features/word/defaults';
import {createExcelDefaults} from '@/features/excel/defaults';
import {createPowerPointDefaults} from '@/features/powerpoint/defaults';
import type {Mode, OfficeDocument} from '@/shared/document/types';

// Compose feature defaults without changing the persisted document envelope.
export const fresh = (mode: Mode = 'word'): OfficeDocument => ({
  mode,
  ...createWordDefaults(),
  ...createExcelDefaults(),
  ...createPowerPointDefaults(),
});
