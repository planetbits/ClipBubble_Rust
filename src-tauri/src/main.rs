#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{
    Emitter, Manager,
};
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::TrayIconBuilder;
use arboard::Clipboard;
use enigo::{Enigo, Key, KeyboardControllable, MouseControllable};
use std::thread;
use std::time::{Duration, Instant};
use std::sync::Mutex;

// A struct to track bubble dimensions in Rust for backend hit-testing
#[derive(Clone, serde::Serialize, serde::Deserialize)]
struct BubbleRect {
    id: String,
    x: f64,
    y: f64,
    width: f64,
    height: f64,
}

fn bubble_contains_point(bubble_x: f64, bubble_y: f64, bubble_width: f64, bubble_height: f64, point_x: f64, point_y: f64) -> bool {
    point_x >= bubble_x && point_x <= bubble_x + bubble_width && point_y >= bubble_y && point_y <= bubble_y + bubble_height
}

// Global shared state to sync bubble layouts between Frontend and Backend
#[derive(Default)]
struct AppState {
    active_bubbles: Mutex<Vec<BubbleRect>>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn expanded_bubble_rect_contains_pointer() {
        assert!(bubble_contains_point(120.0, 80.0, 360.0, 240.0, 180.0, 120.0));
        assert!(!bubble_contains_point(120.0, 80.0, 360.0, 240.0, 500.0, 400.0));
    }
}

#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{GetWindowLongW, SetWindowLongW, GWL_EXSTYLE, GWL_STYLE, WS_EX_NOACTIVATE, WS_EX_TOPMOST, WS_EX_TOOLWINDOW, WS_POPUP, WS_CAPTION};

#[tauri::command]
async fn paste_clipboard_value() -> Result<(), String> {
    let mut enigo = Enigo::new();
    thread::sleep(Duration::from_millis(50));
    enigo.key_down(Key::Control);
    enigo.key_click(Key::Layout('v'));
    enigo.key_up(Key::Control);
    Ok(())
}

#[tauri::command]
fn copy_to_clipboard(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.set_text(&text).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn update_rust_bubbles(state: tauri::State<'_, AppState>, bubbles: Vec<BubbleRect>) -> Result<(), String> {
    let mut guard = state.active_bubbles.lock().unwrap();
    *guard = bubbles;
    Ok(())
}

fn main() {
    println!("ClipBubble main starting");
    tauri::Builder::default()
        .manage(AppState::default()) // Registers the state container
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();

            // Explicitly strip title bars and borders programmatically
            let _ = main_window.set_decorations(false);
            
            // Win32 Overlay optimization: Avoids taskbar bloating or focus hijacking
            #[cfg(target_os = "windows")]
            {
                if let Ok(hwnd) = main_window.hwnd() {
                    unsafe {
                        let hwnd_ptr = windows::Win32::Foundation::HWND(hwnd.0 as isize);
                        let ex_style = GetWindowLongW(hwnd_ptr, GWL_EXSTYLE);
                        let new_ex_style = ex_style | WS_EX_NOACTIVATE.0 as i32 | WS_EX_TOPMOST.0 as i32 | WS_EX_TOOLWINDOW.0 as i32;
                        SetWindowLongW(hwnd_ptr, GWL_EXSTYLE, new_ex_style);

                        // Remove title bar by removing WS_CAPTION and adding WS_POPUP
                        let style = GetWindowLongW(hwnd_ptr, GWL_STYLE);
                        let new_style = (style & !(WS_CAPTION.0 as i32)) | WS_POPUP.0 as i32;
                        SetWindowLongW(hwnd_ptr, GWL_STYLE, new_style);
                    }
                }
            }

            let _ = main_window.set_ignore_cursor_events(true);

            let app_handle = app.handle().clone();

            // Emit welcome event to create initial bubble
            let _ = app_handle.emit("welcome-bubble", ());
            
            // THREAD 1: Clipboard Watcher (Unchanged)
            thread::spawn(move || {
                let Ok(mut clipboard) = Clipboard::new() else { return; };
                let mut last_text = String::new();
                let mut last_change_time = Instant::now();
                let enigo = Enigo::new();

                // Initialize with current clipboard content without triggering a bubble
                if let Ok(current_text) = clipboard.get_text() {
                    last_text = current_text.trim().replace("\r\n", "\n");
                }

                loop {
                    if let Ok(current_text) = clipboard.get_text() {
                        let normalized = current_text.trim().replace("\r\n", "\n");
                        let now = Instant::now();
                        
                        if !normalized.is_empty() && normalized != last_text {
                            if now.duration_since(last_change_time).as_millis() > 500 {
                                last_text = normalized.clone();
                                last_change_time = now;
                                // Capture mouse position at copy moment
                                let (mx, my) = enigo.mouse_location();
                                let _ = app_handle.emit("clip-spawn", (normalized, mx as f64, my as f64));
                            }
                        }
                    }
                    thread::sleep(Duration::from_millis(200));
                }
            });

            // THREAD 2: Global Hit-Test Poller
            // This reads global coordinates and handles toggling ignore_cursor_events reactively
            let hit_window = main_window.clone();
            let app_handle = app.handle().clone();
            
            thread::spawn(move || {
                let enigo = Enigo::new();
                let mut was_clickable = false;
                let mut last_mouse_x = 0;
                let mut last_mouse_y = 0;

                loop {
                    // 1. Fetch current global mouse coordinates via Enigo
                    let (mx, my) = enigo.mouse_location();
                    
                    // Emit mouse position to frontend for bubble spawning
                    if mx != last_mouse_x || my != last_mouse_y {
                        last_mouse_x = mx;
                        last_mouse_y = my;
                        let _ = app_handle.emit("mouse-position", (mx as f64, my as f64));
                    }
                    
                    // 2. Fetch our window coordinates relative to screen space
                    if let (Ok(win_pos), Ok(win_size)) = (hit_window.outer_position(), hit_window.inner_size()) {
                        let wx = win_pos.x as f64;
                        let wy = win_pos.y as f64;
                        
                        // Convert global mouse coordinates to local window canvas coordinates
                        let local_x = mx as f64 - wx;
                        let local_y = my as f64 - wy;

                        let mut is_hovering_bubble = false;

                        // Check if cursor falls within bounds of window viewport
                        if local_x >= 0.0 && local_x <= (win_size.width as f64) && local_y >= 0.0 && local_y <= (win_size.height as f64) {
                            let state_guard = app_handle.state::<AppState>();
                            let bubbles = state_guard.active_bubbles.lock().unwrap();
                            
                            for bubble in bubbles.iter() {
                                let rect_x = bubble.x;
                                let rect_y = bubble.y;
                                let rect_w = bubble.width.max(80.0);
                                let rect_h = bubble.height.max(36.0);

                                if bubble_contains_point(rect_x, rect_y, rect_w, rect_h, local_x, local_y) {
                                    is_hovering_bubble = true;
                                    break;
                                }
                            }
                        }

                        // 3. Commit state change cleanly to Tauri framework thread
                        if is_hovering_bubble != was_clickable {
                            was_clickable = is_hovering_bubble;
                            let w_clone = hit_window.clone();
                            let _ = hit_window.run_on_main_thread(move || {
                                let _ = w_clone.set_ignore_cursor_events(!is_hovering_bubble);
                                // Broadcast state change backward so JS updates styles smoothly
                                let _ = w_clone.emit("hover-state-changed", is_hovering_bubble);
                            });
                        }
                    }
                    thread::sleep(Duration::from_millis(30)); // Snappy 33Hz sampling interval
                }
            });

            let show_item = MenuItem::with_id(app, "show", "Show ClipBubble", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let tray_menu = Menu::with_items(app, &[&show_item, &separator, &quit_item])?;

            let tray = TrayIconBuilder::new()
                .tooltip("ClipBubble")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(move |app, event| {
                    if event.id().as_ref() == "show" {
                        if let Some(window) = app.get_webview_window("main") { let _ = window.show(); }
                    } else if event.id().as_ref() == "quit" {
                        app.exit(0);
                    }
                })
                .build(app)?;

            // Store tray in a way that won't be dropped
            Box::leak(Box::new(tray));

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![paste_clipboard_value, copy_to_clipboard, update_rust_bubbles])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
