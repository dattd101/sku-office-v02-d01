mod features;
mod shared;
mod workspace;
use workspace::sessions;

pub fn run() {
    tauri::Builder::default()
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
