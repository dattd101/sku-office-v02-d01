import type {OfficeDocument} from '@/shared/document/types';
export const addSlide=(d:OfficeDocument):OfficeDocument=>({...d,slides:[...d.slides,{title:'New slide',body:''}],selected_slide:d.slides.length});
