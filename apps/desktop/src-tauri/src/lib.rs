use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem, Submenu};
use tauri::{AppHandle, Manager};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopFileDialogRequest {
    title: String,
    mode: String,
    filters: Vec<DialogFilter>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct DialogFilter {
    name: String,
    extensions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopFileDialogResult {
    canceled: bool,
    paths: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopSettingsSnapshot {
    theme: String,
    control_room_url: String,
    last_workspace_id: Option<String>,
    recent_files: Vec<String>,
    crash_reporting_enabled: bool,
    auto_update_channel: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopAutoUpdateStatus {
    available: bool,
    channel: String,
    version: Option<String>,
    notes: String,
}

#[tauri::command]
async fn open_file_dialog(request: DesktopFileDialogRequest) -> DesktopFileDialogResult {
    // The concrete native dialog is wired through tauri-plugin-dialog in production builds.
    // This command intentionally returns a deterministic placeholder in CI/headless runs.
    DesktopFileDialogResult { canceled: true, paths: Vec::new() }
}

#[tauri::command]
async fn read_settings() -> DesktopSettingsSnapshot {
    DesktopSettingsSnapshot {
        theme: "system".into(),
        control_room_url: "http://localhost:3000/control-room".into(),
        last_workspace_id: None,
        recent_files: Vec::new(),
        crash_reporting_enabled: false,
        auto_update_channel: "stable".into(),
    }
}

#[tauri::command]
async fn write_settings(settings: DesktopSettingsSnapshot) -> DesktopSettingsSnapshot {
    settings
}

#[tauri::command]
async fn check_for_updates() -> DesktopAutoUpdateStatus {
    DesktopAutoUpdateStatus {
        available: false,
        channel: "stable".into(),
        version: None,
        notes: "Auto-update provider is abstracted; no telemetry or cloud sync is enabled.".into(),
    }
}

#[tauri::command]
async fn report_crash_breadcrumb(message: String, context: BTreeMap<String, serde_json::Value>) {
    eprintln!("ubos crash breadcrumb: {message} {context:?}");
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let app_menu = Submenu::with_items(
        app,
        "UBOS",
        true,
        &[
            &MenuItem::with_id(app, "settings", "Settings…", true, None::<&str>)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some("Quit UBOS"))?,
        ],
    )?;
    let file_menu = Submenu::with_items(
        app,
        "File",
        true,
        &[
            &MenuItem::with_id(app, "open_media", "Open Media…", true, Some("CmdOrCtrl+O"))?,
            &MenuItem::with_id(app, "open_project", "Open Project…", true, Some("CmdOrCtrl+Shift+O"))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::close_window(app, Some("Close Window"))?,
        ],
    )?;
    let production_menu = Submenu::with_items(
        app,
        "Production",
        true,
        &[
            &MenuItem::with_id(app, "go_live", "Go Live", true, Some("CmdOrCtrl+L"))?,
            &MenuItem::with_id(app, "start_recording", "Start Recording", true, Some("CmdOrCtrl+R"))?,
            &MenuItem::with_id(app, "cut_transition", "Cut Transition", true, Some("Space"))?,
        ],
    )?;
    let view_menu = Submenu::with_items(app, "View", true, &[&PredefinedMenuItem::fullscreen(app, Some("Toggle Full Screen"))?])?;
    Menu::with_items(app, &[&app_menu, &file_menu, &production_menu, &view_menu])
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            app.set_menu(build_menu(app.handle())?)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![open_file_dialog, read_settings, write_settings, check_for_updates, report_crash_breadcrumb])
        .run(tauri::generate_context!())
        .expect("error while running UBOS desktop shell");
}
