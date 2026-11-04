//! Read-only PDF support: do not attempt to convert PDF into editable Office data.
use crate::shared::document::OfficeDocument;
use std::path::Path;

const MAX_PDF_SIZE: u64 = 30 * 1024 * 1024;

pub(crate) fn read(path: &Path) -> Result<OfficeDocument, String> {
    let meta = std::fs::metadata(path).map_err(|e| e.to_string())?;
    if meta.len() > MAX_PDF_SIZE { return Err("PDF exceeds 30 MB limit".into()); }
    let bytes = std::fs::read(path).map_err(|e| e.to_string())?;
    if !bytes.starts_with(b"%PDF-") { return Err("Invalid PDF header".into()); }
    Ok(OfficeDocument::empty("pdf"))
}
