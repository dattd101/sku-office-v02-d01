use super::{
    formats::{read_word, write_word},
    model::WordDocument,
};
use crate::shared::document::OfficeDocument;
use std::path::Path;

pub(crate) fn read(path: &Path) -> Result<OfficeDocument, String> {
    let word = read_word(path).map_err(|e| e.to_string())?;
    let mut doc = OfficeDocument::empty("word");
    doc.word = word.text;
    Ok(doc)
}

pub(crate) fn write(path: &Path, doc: &OfficeDocument) -> Result<(), String> {
    write_word(
        path,
        &WordDocument {
            text: doc.word.clone(),
        },
    )
    .map_err(|e| e.to_string())
}
