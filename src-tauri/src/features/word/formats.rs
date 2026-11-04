use super::model::WordDocument;
use crate::shared::ooxml::{escape,read_part,write_zip};
use quick_xml::{events::Event,Reader as XmlReader};
use anyhow::Result;
use std::path::Path;
pub fn read_word(path:&Path)->Result<WordDocument> {
    let xml=read_part(path,"word/document.xml")?;
    // Paragraph-aware extraction; formatting is not preserved in this starter.
    let mut reader=XmlReader::from_str(&xml); let mut text=String::new(); let mut in_text=false;
    loop { match reader.read_event()? {
        Event::Start(e) if e.local_name().as_ref()==b"t" => in_text=true,
        Event::Text(e) if in_text => text.push_str(&e.unescape()?),
        Event::End(e) if e.local_name().as_ref()==b"t" => in_text=false,
        Event::End(e) if e.local_name().as_ref()==b"p" => text.push('\n'),
        Event::Eof=>break, _=>{}
    }} Ok(WordDocument { text: text.trim_end_matches('\n').to_owned() })
}
pub fn write_word(path:&Path,doc:&WordDocument)->Result<()> {
    let mut body=String::new();
    for line in doc.text.split('\n') { body.push_str(&format!("<w:p><w:r><w:t xml:space=\"preserve\">{}</w:t></w:r></w:p>",escape(line))); }
    let document=format!(r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{body}<w:sectPr/></w:body></w:document>"#);
    write_zip(path,&[
        ("[Content_Types].xml",r#"<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>"#.into()),
        ("_rels/.rels",r#"<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>"#.into()),
        ("word/document.xml",document)
    ])
}

#[cfg(test)]
mod tests {
 use super::*;
 #[test]
 fn basic_document_round_trip() {
 let original:WordDocument=WordDocument{text:"Hello & <world>\nSecond paragraph".into()};
 let extension="docx";
 let unique=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
 let path=std::env::temp_dir().join(format!("sku-d01-{}-{unique}.{extension}",std::process::id()));
 write_word(&path,&original).unwrap();
 let actual=read_word(&path).unwrap();
 std::fs::remove_file(&path).unwrap();
 assert_eq!(actual.text, original.text);
 }
}
