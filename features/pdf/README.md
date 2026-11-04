# PDF Reader (read-only)

- `reader.tsx`: separate PDF window UI. Loads PDF bytes through Tauri command `read_pdf_session`, creates a `Blob` URL, and embeds the browser/WebView2 PDF viewer.
- `styles.css`: isolated PDF styling.
- `src-tauri/src/features/pdf/adapter.rs`: validates PDF header and size (30 MB maximum) and supplies bytes to the UI.

Open via **Manager → Open file → select .pdf**. The existing session infrastructure remembers the path for reopening. No editing, saving or PDF conversion is implemented.

Rendering depends on the target WebView2 runtime's built-in PDF support. Test on the intended Windows machines. If PDF embedding is unavailable, integrate a bundled PDF.js viewer instead.
