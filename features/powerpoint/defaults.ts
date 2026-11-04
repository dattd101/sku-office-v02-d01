import type {OfficeDocument} from '@/shared/document/types';

export const createPowerPointDefaults = (): Pick<OfficeDocument, 'slides' | 'selected_slide'> => ({
  slides: [{title: 'Your presentation', body: 'Click here to add your ideas'}],
  selected_slide: 0,
});
