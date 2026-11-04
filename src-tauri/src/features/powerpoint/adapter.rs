use super::{
    formats::{read_pptx, write_pptx},
    model::{Presentation, Slide},
};
use crate::shared::document::{OfficeDocument, UiSlide};
use std::path::Path;

pub(crate) fn read(path: &Path) -> Result<OfficeDocument, String> {
    let pres = read_pptx(path).map_err(|e| e.to_string())?;
    let mut doc = OfficeDocument::empty("powerpoint");
    doc.selected_slide = pres.selected;
    doc.slides = pres
        .slides
        .into_iter()
        .map(|s| UiSlide {
            title: s.title,
            body: s.body,
        })
        .collect();
    Ok(doc)
}

pub(crate) fn write(path: &Path, doc: &OfficeDocument) -> Result<(), String> {
    let slides = doc
        .slides
        .iter()
        .map(|s| Slide {
            title: s.title.clone(),
            body: s.body.clone(),
        })
        .collect();
    write_pptx(
        path,
        &Presentation {
            slides,
            selected: doc.selected_slide,
        },
    )
    .map_err(|e| e.to_string())
}
