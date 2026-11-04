// Stable JSON contract shared by the frontend, Tauri and recovery snapshots.
export type Mode = 'word' | 'excel' | 'powerpoint' | 'pdf';
export type Sheet = {name: string; cells: Record<string, string>};
export type Slide = {title: string; body: string};
export type OfficeDocument = {
  mode: Mode;
  word: string;
  sheets: Sheet[];
  selected_sheet: number;
  slides: Slide[];
  selected_slide: number;
};
