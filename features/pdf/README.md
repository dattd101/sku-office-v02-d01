# PDF Reader (read-only)

- `reader.tsx`: separate PDF window UI. Loads PDF bytes through Tauri command `read_pdf_session`, creates a `Blob` URL, and embeds the browser/WebView2 PDF viewer.
- `styles.css`: isolated PDF styling.
- `src-tauri/src/features/pdf/adapter.rs`: validates PDF header and size (30 MB maximum).
- `src-tauri/src/workspace/files.rs`: owns the `read_pdf_session` command and resolves the session path before calling the PDF adapter, keeping session access outside the feature module.

Open via **Manager → Open file → select .pdf**. The existing session infrastructure remembers the path for reopening. No editing, saving or PDF conversion is implemented.

Rendering depends on the target WebView2 runtime's built-in PDF support. Test on the intended Windows machines. If PDF embedding is unavailable, integrate a bundled PDF.js viewer instead.

The Tauri content security policy must allow `frame-src blob:` because the reader embeds a local PDF Blob URL. A policy of `frame-src 'none'` blocks the viewer. Restart the desktop app after changing this policy.
