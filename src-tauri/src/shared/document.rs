use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub(crate) struct UiSheet {
    pub(crate) name: String,
    pub(crate) cells: BTreeMap<String, String>,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub(crate) struct UiSlide {
    pub(crate) title: String,
    pub(crate) body: String,
}
#[derive(Clone, Debug, Serialize, Deserialize)]
pub(crate) struct OfficeDocument {
    pub(crate) mode: String,
    pub(crate) word: String,
    pub(crate) sheets: Vec<UiSheet>,
    pub(crate) selected_sheet: usize,
    pub(crate) slides: Vec<UiSlide>,
    pub(crate) selected_slide: usize,
}
impl OfficeDocument {
    pub(crate) fn empty(mode: &str) -> Self {
        Self {
            mode: mode.into(),
            word: String::new(),
            sheets: vec![UiSheet {
                name: "Sheet1".into(),
                cells: BTreeMap::new(),
            }],
            selected_sheet: 0,
            slides: vec![UiSlide {
                title: "New presentation".into(),
                body: String::new(),
            }],
            selected_slide: 0,
        }
    }
}
