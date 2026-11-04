use super::model::{Presentation,Slide};
use crate::shared::ooxml::{escape,xml_texts,write_zip};
use anyhow::{anyhow,Result};
use std::{fs::File,io::Read,path::Path};
use zip::ZipArchive;
pub fn read_pptx(path:&Path)->Result<Presentation> {
    let file=File::open(path)?; let mut zip=ZipArchive::new(file)?;
    let mut slide_parts=Vec::new();
    for i in 0..zip.len() { let name=zip.by_index(i)?.name().to_owned();
        if name.starts_with("ppt/slides/slide") && name.ends_with(".xml") && !name.contains("_rels") { slide_parts.push(name); }
    }
    slide_parts.sort_by_key(|name| name.trim_start_matches("ppt/slides/slide").trim_end_matches(".xml").parse::<usize>().unwrap_or(usize::MAX));
    let mut slides=Vec::new();
    for part in slide_parts { let mut xml=String::new(); zip.by_name(&part)?.read_to_string(&mut xml)?;
        let texts=xml_texts(&xml,&[b"t"])?;
        slides.push(Slide { title:texts.first().cloned().unwrap_or_default(), body:texts.into_iter().skip(1).collect::<Vec<_>>().join("\n") });
    }
    if slides.is_empty() { return Err(anyhow!("No slides found")); }
    Ok(Presentation { slides,selected:0 })
}
pub fn write_pptx(path:&Path,pres:&Presentation)->Result<()> {
    let mut parts:Vec<(String,String)>=Vec::new();
    let mut overrides=String::new(); let mut ids=String::new(); let mut rels=String::new();
    for (i,slide) in pres.slides.iter().enumerate() {
        let n=i+1; overrides.push_str(&format!("<Override PartName=\"/ppt/slides/slide{n}.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.presentationml.slide+xml\"/>"));
        ids.push_str(&format!("<p:sldId id=\"{}\" r:id=\"rId{n}\"/>",256+i));
        rels.push_str(&format!("<Relationship Id=\"rId{n}\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide\" Target=\"slides/slide{n}.xml\"/>"));
        let shape=|id:usize,name:&str,text:&str,y:usize|format!(r#"<p:sp><p:nvSpPr><p:cNvPr id="{id}" name="{name}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="914400" y="{y}"/><a:ext cx="7315200" cy="1371600"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr><p:txBody><a:bodyPr/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US"/><a:t>{}</a:t></a:r><a:endParaRPr lang="en-US"/></a:p></p:txBody></p:sp>"#,escape(text));
        let xml=format!(r#"<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>{}{}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>"#,shape(2,"Title",&slide.title,700000),shape(3,"Content",&slide.body,2600000));
        parts.push((format!("ppt/slides/slide{n}.xml"),xml));
    }
    let types=format!(r#"<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>{overrides}</Types>"#);
    let presxml=format!(r#"<?xml version="1.0" encoding="UTF-8"?><p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:sldIdLst>{ids}</p:sldIdLst><p:sldSz cx="9144000" cy="5143500" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>"#);
    parts.push(("[Content_Types].xml".into(),types));
    parts.push(("_rels/.rels".into(),r#"<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>"#.into()));
    parts.push(("ppt/presentation.xml".into(),presxml));
    parts.push(("ppt/_rels/presentation.xml.rels".into(),format!(r#"<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">{rels}</Relationships>"#)));
    let borrowed:Vec<(&str,String)>=parts.iter().map(|(n,c)|(n.as_str(),c.clone())).collect(); write_zip(path,&borrowed)
}

#[cfg(test)]
mod tests {
 use super::*;
 #[test]
 fn basic_document_round_trip() {
 let original:Presentation=Presentation{slides:vec![Slide{title:"Title & <test>".into(),body:"Body".into()},Slide{title:"Second".into(),body:"Content".into()}],selected:0};
 let extension="pptx";
 let unique=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
 let path=std::env::temp_dir().join(format!("sku-d01-{}-{unique}.{extension}",std::process::id()));
 write_pptx(&path,&original).unwrap();
 let actual=read_pptx(&path).unwrap();
 std::fs::remove_file(&path).unwrap();
 assert_eq!(actual.slides.len(),2);assert_eq!(actual.slides[0].title,original.slides[0].title);assert_eq!(actual.slides[1].body,original.slides[1].body);
 }
}
