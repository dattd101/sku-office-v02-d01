use crate::features::{excel, powerpoint, word};
use crate::shared::document::OfficeDocument;
use serde::Serialize;
use std::path::Path;

#[derive(Serialize)]
pub(crate) struct FileResult {
    pub(crate) path: String,
    pub(crate) document: OfficeDocument,
}

pub(crate) fn open_document() -> Result<Option<FileResult>, String> {
    let Some(path) = rfd::FileDialog::new()
        .add_filter("Office documents", &["docx", "xlsx", "xls", "pptx", "pdf", "json"])
        .pick_file()
    else {
        return Ok(None);
    };
    let document = read_document(&path)?;
    Ok(Some(FileResult {
        path: path.display().to_string(),
        document,
    }))
}

fn read_document(path: &Path) -> Result<OfficeDocument, String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "docx" => word::adapter::read(path),
        "xlsx" | "xls" => excel::adapter::read(path),
        "pptx" => powerpoint::adapter::read(path),
        "pdf" => crate::features::pdf::adapter::read(path),
        "json" => serde_json::from_slice(&std::fs::read(path).map_err(|e| e.to_string())?)
            .map_err(|e: serde_json::Error| e.to_string()),
        _ => return Err("Unsupported file extension".into()),
    }
}

pub(crate) fn write_document(path: &Path, doc: &OfficeDocument) -> Result<(), String> {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    if doc.mode == "pdf" { return Err("PDF reader is read-only".into()); }
    match ext.as_str() {
        "docx" => word::adapter::write(path, doc),
        "xlsx" => excel::adapter::write(path, doc),
        "pptx" => powerpoint::adapter::write(path, doc),
        "json" => std::fs::write(
            path,
            serde_json::to_vec_pretty(doc).map_err(|e| e.to_string())?,
        )
        .map_err(|e| e.to_string()),
        _ => Err("Choose a .docx, .xlsx, .pptx or .json filename".into()),
    }
}

#[tauri::command]
pub(crate) fn read_pdf_session(app: tauri::AppHandle, id: String) -> Result<Vec<u8>, String> {
    let session = super::sessions::get_session(app, id)?;
    if session.document.mode != "pdf" { return Err("Not a PDF session".into()); }
    let path = session.path.ok_or("PDF session has no file path")?;
    let path = Path::new(&path);
    crate::features::pdf::adapter::read(path)?;
    std::fs::read(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub(crate) fn save_document(
    document: OfficeDocument,
    path: Option<String>,
    save_as: bool,
) -> Result<Option<String>, String> {
    let target = if !save_as {
        path.map(std::path::PathBuf::from)
    } else {
        None
    };
    let path = match target {
        Some(p) => p,
        None => {
            let (ext, filter) = match document.mode.as_str() {
                "word" => ("docx", "Word"),
                "excel" => ("xlsx", "Excel"),
                _ => ("pptx", "PowerPoint"),
            };
            let Some(p) = rfd::FileDialog::new()
                .add_filter(filter, &[ext])
                .add_filter("Rust Office project", &["json"])
                .set_file_name(&format!("Untitled.{ext}"))
                .save_file()
            else {
                return Ok(None);
            };
            p
        }
    };
    write_document(&path, &document)?;
    Ok(Some(path.display().to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::document::{UiSheet, UiSlide};

    struct TempFile(std::path::PathBuf);
    impl Drop for TempFile {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.0);
        }
    }
    fn temp(extension: &str) -> TempFile {
        TempFile(std::env::temp_dir().join(format!(
            "office-adapter-{}.{extension}",
            uuid::Uuid::new_v4()
        )))
    }
    fn sample(mode: &str) -> OfficeDocument {
        let mut doc = OfficeDocument::empty(mode);
        doc.word = "Hello & <world>\nSecond paragraph".into();
        doc.sheets = vec![
            UiSheet {
                name: "Data".into(),
                cells: [
                    ("0:0".into(), "Text & value".into()),
                    ("2:3".into(), "42".into()),
                ]
                .into_iter()
                .collect(),
            },
            UiSheet {
                name: "Other".into(),
                cells: [("1:1".into(), "Second sheet".into())]
                    .into_iter()
                    .collect(),
            },
        ];
        doc.selected_sheet = 1;
        doc.slides = vec![
            UiSlide {
                title: "Title & <test>".into(),
                body: "Body".into(),
            },
            UiSlide {
                title: "Second".into(),
                body: "Content".into(),
            },
        ];
        doc.selected_slide = 1;
        doc
    }

    #[test]
    fn existing_snapshot_contract_survives_json_dispatch() {
        for mode in ["word", "excel", "powerpoint"] {
            let original = sample(mode);
            let file = temp("json");
            write_document(&file.0, &original).unwrap();
            let actual = read_document(&file.0).unwrap();
            assert_eq!(
                serde_json::to_value(&actual).unwrap(),
                serde_json::to_value(&original).unwrap()
            );
            let mut keys: Vec<_> = serde_json::to_value(&actual)
                .unwrap()
                .as_object()
                .unwrap()
                .keys()
                .cloned()
                .collect();
            keys.sort();
            assert_eq!(
                keys,
                [
                    "mode",
                    "selected_sheet",
                    "selected_slide",
                    "sheets",
                    "slides",
                    "word"
                ]
            );
        }
    }

    #[test]
    fn office_dispatch_preserves_feature_content() {
        for (mode, extension, fields) in [
            ("word", "docx", vec!["word"]),
            ("excel", "xlsx", vec!["sheets"]),
            ("powerpoint", "pptx", vec!["slides"]),
        ] {
            let original = sample(mode);
            let file = temp(extension);
            write_document(&file.0, &original).unwrap();
            let actual = read_document(&file.0).unwrap();
            assert_eq!(actual.mode, mode);
            let before = serde_json::to_value(original).unwrap();
            let after = serde_json::to_value(actual).unwrap();
            for field in fields {
                assert_eq!(after[field], before[field], "{extension}: {field}");
            }
            // Office formats currently reopen at the first sheet/slide; JSON preserves selection.
            assert_eq!(after["selected_sheet"], 0);
            assert_eq!(after["selected_slide"], 0);
        }
    }
}
