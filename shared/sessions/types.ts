import type {OfficeDocument} from '@/shared/document/types';
export type DocumentSession={id:string;document:OfficeDocument;path:string|null;dirty:boolean;updated_at:number};
