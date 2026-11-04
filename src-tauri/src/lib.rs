mod features;
mod shared;
mod workspace;
use workspace::sessions;

pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let excel = std::env::args().any(|arg| arg == "--excel")
                    || std::env::current_exe().ok()
                        .and_then(|p| p.file_stem().map(|s| s.to_string_lossy().to_lowercase()))
                        .is_some_and(|name| name == "skuexcel");
                let result = if excel {
                    async {
                        let recent = sessions::list_sessions(handle.clone())?
                            .into_iter().find(|s| s.document.mode == "excel");
                        let session = match recent {
                            Some(s) => s,
                            None => sessions::create_session(handle.clone(), "excel".into())?,
                        };
                        sessions::open_editor_window(handle.clone(), session.id).await
                    }.await
                } else {
                    sessions::focus_manager(handle.clone()).await
                };
                if let Err(error) = result {
                    rfd::MessageDialog::new().set_title("Sku Office")
                        .set_description(format!("Unable to start: {error}"))
                        .set_level(rfd::MessageLevel::Error).show();
                    handle.exit(1);
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            workspace::files::save_document,
            workspace::files::read_pdf_session,
            sessions::create_session,
            sessions::import_session,
            sessions::get_session,
            sessions::list_sessions,
            sessions::snapshot_session,
            sessions::save_session,
            sessions::discard_session,
            sessions::open_editor_window,
            sessions::focus_manager
        ])
        .run(tauri::generate_context!())
        .expect("failed to run Rust Office Modern");
}
