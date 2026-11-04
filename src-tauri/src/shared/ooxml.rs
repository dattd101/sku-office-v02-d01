use anyhow::{Context,Result};
use quick_xml::{events::Event,Reader as XmlReader};
use std::{fs::File,io::{Read,Write},path::Path};
use zip::{ZipArchive,ZipWriter,write::SimpleFileOptions};
pub(crate) fn escape(s:&str)->String { s.replace('&',"&amp;").replace('<',"&lt;").replace('>',"&gt;").replace('"',"&quot;").replace('\'',"&apos;") }
pub(crate) fn read_part(path:&Path, name:&str)->Result<String> {
    let mut archive=ZipArchive::new(File::open(path)?)?;
    let mut part=archive.by_name(name).with_context(||format!("Missing OOXML part: {name}"))?;
    let mut text=String::new(); part.read_to_string(&mut text)?; Ok(text)
}
pub(crate) fn xml_texts(xml:&str, tags:&[&[u8]])->Result<Vec<String>> {
    let mut r=XmlReader::from_str(xml);
    let mut output=Vec::new(); let mut inside=false;
    loop { match r.read_event()? {
        Event::Start(e) => { inside=tags.iter().any(|tag| e.local_name().as_ref()==*tag); },
        Event::Text(e) if inside => { output.push(e.unescape()?.into_owned()); },
        Event::End(e) if tags.iter().any(|tag| e.local_name().as_ref()==*tag) => inside=false,
        Event::Eof=>break, _=>{}
    }} Ok(output)
}
pub(crate) fn write_zip(path:&Path, parts:&[(&str,String)])->Result<()> {
    let mut zip=ZipWriter::new(File::create(path)?);
    for (name,content) in parts { zip.start_file(*name,SimpleFileOptions::default().compression_method(zip::CompressionMethod::Deflated))?; zip.write_all(content.as_bytes())?; }
    zip.finish()?; Ok(())
}
