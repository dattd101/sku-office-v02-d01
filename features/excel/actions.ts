import type {OfficeDocument} from '@/shared/document/types';
export const addSheet=(d:OfficeDocument):OfficeDocument=>({...d,sheets:[...d.sheets,{name:`Sheet${d.sheets.length+1}`,cells:{}}],selected_sheet:d.sheets.length});
