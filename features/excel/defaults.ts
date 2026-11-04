import type {OfficeDocument} from '@/shared/document/types';

export const createExcelDefaults = (): Pick<OfficeDocument, 'sheets' | 'selected_sheet'> => ({
  sheets: [{name: 'Sheet1', cells: {
    '0:0': 'Product', '0:1': 'Quantity', '0:2': 'Price',
    '1:0': 'Example', '1:1': '2', '1:2': '150',
  }}],
  selected_sheet: 0,
});
