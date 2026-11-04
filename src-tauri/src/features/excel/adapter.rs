use super::{
    formats::{read_excel, write_excel},
    model::{Sheet, Workbook},
};
use crate::shared::document::{OfficeDocument, UiSheet};
use std::path::Path;

pub(crate) fn read(path: &Path) -> Result<OfficeDocument, String> {
    let book = read_excel(path).map_err(|e| e.to_string())?;
    let mut doc = OfficeDocument::empty("excel");
    doc.selected_sheet = book.selected;
    doc.sheets = book
        .sheets
        .into_iter()
        .map(|s| UiSheet {
            name: s.name,
            cells: s
                .cells
                .into_iter()
                .map(|((r, c), v)| (format!("{r}:{c}"), v))
                .collect(),
        })
        .collect();
    Ok(doc)
}

pub(crate) fn write(path: &Path, doc: &OfficeDocument) -> Result<(), String> {
    let sheets = doc
        .sheets
        .iter()
        .map(|s| Sheet {
            name: s.name.clone(),
            cells: s
                .cells
                .iter()
                .filter_map(|(key, value)| {
                    let (r, c) = key.split_once(':')?;
                    Some((
                        (r.parse::<u32>().ok()?, c.parse::<u16>().ok()?),
                        value.clone(),
                    ))
                })
                .collect(),
        })
        .collect();
    write_excel(
        path,
        &Workbook {
            sheets,
            selected: doc.selected_sheet,
        },
    )
    .map_err(|e| e.to_string())
}
