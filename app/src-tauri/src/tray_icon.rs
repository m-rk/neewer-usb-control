use tauri::AppHandle;

pub const TRAY_ID: &str = "main";

const CONNECTED_ON: &[u8] = include_bytes!("../icons/tray-icon.png");
const CONNECTED_OFF: &[u8] = include_bytes!("../icons/tray-icon-off.png");
const DISCONNECTED_ON: &[u8] = include_bytes!("../icons/tray-icon-disconnected-on.png");
const DISCONNECTED_OFF: &[u8] = include_bytes!("../icons/tray-icon-disconnected-off.png");

pub fn image_for_state(
    connected: bool,
    is_on: bool,
) -> Result<tauri::image::Image<'static>, String> {
    let bytes = match (connected, is_on) {
        (true, true) => CONNECTED_ON,
        (true, false) => CONNECTED_OFF,
        (false, true) => DISCONNECTED_ON,
        (false, false) => DISCONNECTED_OFF,
    };

    tauri::image::Image::from_bytes(bytes).map_err(|e| format!("Invalid tray icon: {e}"))
}

pub fn set_state(app: &AppHandle, connected: bool, is_on: bool) -> Result<(), String> {
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "Tray icon not found".to_string())?;
    let icon = image_for_state(connected, is_on)?;

    tray.set_icon(Some(icon))
        .map_err(|e| format!("Failed to set tray icon: {e}"))?;
    tray.set_icon_as_template(true)
        .map_err(|e| format!("Failed to set tray template mode: {e}"))?;

    Ok(())
}
