use super::model::{Workbook,Sheet};
use calamine::{open_workbook_auto,Reader};
use anyhow::{Context,Result};
use std::path::Path;
pub fn read_excel(path:&Path)->Result<Workbook> {
    let mut book=open_workbook_auto(path)?; let names=book.sheet_names().to_vec();
    let mut sheets=Vec::new();
    for name in names {
        let range=book.worksheet_range(&name)?;
        let mut sheet=Sheet { name, ..Default::default() };
        let (start_row,start_col)=range.start().unwrap_or((0,0));
        for (r,row) in range.rows().enumerate() { for (c,cell) in row.iter().enumerate() {
            let value=cell.to_string(); if !value.is_empty() { sheet.cells.insert((start_row+r as u32,(start_col+c as u32).try_into().context("Column index exceeds XLSX limits")?),value); }
        }} sheets.push(sheet);
    }
    if sheets.is_empty() { return Ok(Workbook::default()); }
    Ok(Workbook { sheets,selected:0 })
}
pub fn write_excel(path:&Path,book:&Workbook)->Result<()> {
    let mut x=rust_xlsxwriter::Workbook::new();
    for sheet in &book.sheets {
        let ws=x.add_worksheet(); ws.set_name(&sheet.name)?;
        for (&(row,col),value) in &sheet.cells {
            if value.starts_with('=') { ws.write_formula(row,col,value.as_str())?; }
            else if let Ok(n)=value.parse::<f64>() { ws.write_number(row,col,n)?; }
            else { ws.write_string(row,col,value)?; }
        }
    } x.save(path)?; Ok(())
}

#[cfg(test)]
mod tests {
 use super::*;
 #[test]
 fn basic_document_round_trip() {
 let original:Workbook={let mut book=Workbook::default();book.set(0,0,"Text & value".into());book.set(1,1,"42".into());book};
 let extension="xlsx";
 let unique=std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_nanos();
 let path=std::env::temp_dir().join(format!("sku-d01-{}-{unique}.{extension}",std::process::id()));
 write_excel(&path,&original).unwrap();
 let actual=read_excel(&path).unwrap();
 std::fs::remove_file(&path).unwrap();
 assert_eq!(actual.sheets[0].cells, original.sheets[0].cells);
 }
}
