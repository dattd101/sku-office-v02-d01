#[derive(Debug, Clone, Default)]
pub struct Slide { pub title:String, pub body:String }
#[derive(Debug, Clone)]
pub struct Presentation { pub slides:Vec<Slide>, pub selected:usize }
impl Default for Presentation { fn default() -> Self { Self { slides: vec![Slide { title:"New presentation".into(), body:String::new() }], selected:0 } } }
