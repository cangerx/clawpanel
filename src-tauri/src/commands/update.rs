use crate::commands::config::normalize_panel_config_value;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::Write;
use std::path::{Component, Path, PathBuf};
use std::sync::atomic::{AtomicBool, Ordering};

/// 前端热更新目录 (~/.openclaw/clawpanel/web-update/)
pub fn update_dir() -> PathBuf {
    super::openclaw_dir().join("clawpanel").join("web-update")
}

fn update_stage_dir() -> PathBuf {
    super::openclaw_dir()
        .join("clawpanel")
        .join("web-update.staging")
}

fn update_backup_dir() -> PathBuf {
    super::openclaw_dir().join("clawpanel").join("web-update.bak")
}

fn update_state_path(dir: &Path) -> PathBuf {
    dir.join(".state.json")
}

fn update_version_path(dir: &Path) -> PathBuf {
    dir.join(".version")
}

/// 更新清单 URL（GitHub Pages 托管）
const LATEST_JSON_URL: &str = "https://claw.qt.cool/update/latest.json";
const DEFAULT_UPDATE_INTERVAL_MINUTES: u64 = 30;
const MIN_UPDATE_INTERVAL_MINUTES: u64 = 5;
static FRONTEND_UPDATER_STARTED: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
struct UpdateManifest {
    #[serde(default)]
    version: String,
    #[serde(default, rename = "minAppVersion")]
    min_app_version: String,
    #[serde(default)]
    hash: String,
    #[serde(default)]
    url: String,
    #[serde(default)]
    size: Option<u64>,
    #[serde(default)]
    changelog: Option<String>,
    #[serde(default, rename = "releasedAt")]
    released_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
struct AppliedUpdateState {
    #[serde(default)]
    version: String,
    #[serde(default)]
    hash: String,
    #[serde(default)]
    url: String,
    #[serde(default, rename = "appliedAt")]
    applied_at: String,
    #[serde(default, rename = "fileCount")]
    file_count: usize,
}

#[derive(Debug, Clone)]
struct UpdateSettings {
    mode: String,
    frontend_enabled: bool,
    interval_minutes: u64,
    require_hash_for_background: bool,
}

impl Default for UpdateSettings {
    fn default() -> Self {
        Self {
            mode: "notify".to_string(),
            frontend_enabled: true,
            interval_minutes: DEFAULT_UPDATE_INTERVAL_MINUTES,
            require_hash_for_background: true,
        }
    }
}

pub fn start_background_frontend_updater() {
    if FRONTEND_UPDATER_STARTED.swap(true, Ordering::SeqCst) {
        return;
    }

    tauri::async_runtime::spawn(async move {
        loop {
            let settings = read_update_settings().unwrap_or_default();
            if settings.mode == "background" && settings.frontend_enabled {
                let _ = run_background_frontend_update(&settings).await;
            }
            let delay_minutes = settings
                .interval_minutes
                .max(MIN_UPDATE_INTERVAL_MINUTES);
            tokio::time::sleep(std::time::Duration::from_secs(delay_minutes * 60)).await;
        }
    });
}

/// 检查前端是否有新版本可用
#[tauri::command]
pub async fn check_frontend_update() -> Result<Value, String> {
    let manifest = fetch_manifest().await?;
    let current = env!("CARGO_PKG_VERSION");
    let compatible = version_ge(current, &manifest.min_app_version);
    let state = read_applied_update_state();
    let ready = update_dir().join("index.html").exists();
    let update_ready = ready && state.as_ref().map(|s| s.version.as_str()) == Some(manifest.version.as_str());
    let has_update = !manifest.version.is_empty() && compatible && version_gt(&manifest.version, current) && !update_ready;

    Ok(json!({
        "currentVersion": current,
        "latestVersion": manifest.version,
        "hasUpdate": has_update,
        "compatible": compatible,
        "updateReady": update_ready,
        "updateVersion": state.as_ref().map(|s| s.version.clone()).unwrap_or_default(),
        "manifest": manifest
    }))
}

/// 下载并解压前端更新包
#[tauri::command]
pub async fn download_frontend_update(url: String, expected_hash: String) -> Result<Value, String> {
    let manifest = fetch_manifest().await.ok().filter(|item| item.url == url);
    let hash = if !expected_hash.trim().is_empty() {
        expected_hash.trim().to_string()
    } else {
        manifest
            .as_ref()
            .map(|item| item.hash.trim().to_string())
            .unwrap_or_default()
    };

    let client = super::build_http_client(std::time::Duration::from_secs(120), Some("ClawPanel"))
        .map_err(|e| format!("HTTP 客户端错误: {e}"))?;

    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("下载失败: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("下载失败: HTTP {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("读取数据失败: {e}"))?;

    apply_update_archive(
        bytes.as_ref(),
        manifest.as_ref(),
        if hash.is_empty() { None } else { Some(hash.as_str()) },
    )
}

/// 回退前端更新（删除热更新目录，下次启动使用内嵌资源）
#[tauri::command]
pub fn rollback_frontend_update() -> Result<Value, String> {
    let dir = update_dir();
    if dir.exists() {
        fs::remove_dir_all(&dir).map_err(|e| format!("回退失败: {e}"))?;
    }
    let stage = update_stage_dir();
    if stage.exists() {
        let _ = fs::remove_dir_all(stage);
    }
    let backup = update_backup_dir();
    if backup.exists() {
        let _ = fs::remove_dir_all(backup);
    }
    Ok(json!({ "success": true }))
}

/// 获取当前热更新状态
#[tauri::command]
pub fn get_update_status() -> Result<Value, String> {
    let dir = update_dir();
    let ready = dir.join("index.html").exists();
    let state = read_applied_update_state();
    let panel = load_panel_config_value()?;
    let updates = panel.get("updates").cloned().unwrap_or_else(|| json!({}));

    Ok(json!({
        "currentVersion": env!("CARGO_PKG_VERSION"),
        "updateReady": ready,
        "updateVersion": state.as_ref().map(|item| item.version.clone()).unwrap_or_default(),
        "updateState": state,
        "updateDir": dir.to_string_lossy(),
        "lastCheckAt": updates.get("lastCheckAt").cloned().unwrap_or(Value::Null),
        "lastResult": updates.get("lastResult").cloned().unwrap_or(Value::Null),
        "lastError": updates.get("lastError").cloned().unwrap_or(Value::Null)
    }))
}

async fn run_background_frontend_update(settings: &UpdateSettings) -> Result<(), String> {
    let check_at = now_iso();
    let result = match fetch_manifest().await {
        Ok(manifest) => {
            let current = env!("CARGO_PKG_VERSION");
            let version = manifest.version.clone();
            let min_app_version = manifest.min_app_version.clone();
            let manifest_hash = manifest.hash.clone();

            if version.is_empty() {
                json!({
                    "kind": "frontend",
                    "status": "skipped",
                    "reason": "missing-version",
                    "checkedAt": &check_at,
                })
            } else if !version_ge(current, &min_app_version) {
                json!({
                    "kind": "frontend",
                    "status": "skipped",
                    "reason": "incompatible",
                    "checkedAt": &check_at,
                    "version": &version,
                    "minAppVersion": &min_app_version,
                })
            } else if !version_gt(&version, current) {
                json!({
                    "kind": "frontend",
                    "status": "up-to-date",
                    "checkedAt": &check_at,
                    "version": &version,
                })
            } else if update_dir().join("index.html").exists()
                && read_applied_update_state()
                    .as_ref()
                    .map(|item| item.version.as_str())
                    == Some(version.as_str())
            {
                json!({
                    "kind": "frontend",
                    "status": "already-downloaded",
                    "checkedAt": &check_at,
                    "version": &version,
                })
            } else if settings.require_hash_for_background && manifest_hash.trim().is_empty() {
                let error = "后台自动更新要求 latest.json 提供 hash".to_string();
                record_update_check(
                    &check_at,
                    Some(json!({
                        "kind": "frontend",
                        "status": "failed",
                        "checkedAt": &check_at,
                        "version": &version,
                        "reason": "missing-hash",
                    })),
                    Some(error.clone()),
                )?;
                return Err(error);
            } else {
                let client = super::build_http_client(
                    std::time::Duration::from_secs(120),
                    Some("ClawPanel Background Updater"),
                )
                .map_err(|e| format!("HTTP 客户端错误: {e}"))?;
                let resp = client
                    .get(&manifest.url)
                    .send()
                    .await
                    .map_err(|e| format!("下载失败: {e}"))?;
                if !resp.status().is_success() {
                    return Err(format!("下载失败: HTTP {}", resp.status()));
                }
                let bytes = resp
                    .bytes()
                    .await
                    .map_err(|e| format!("读取数据失败: {e}"))?;
                let applied = apply_update_archive(
                    bytes.as_ref(),
                    Some(&manifest),
                    if manifest_hash.trim().is_empty() {
                        None
                    } else {
                        Some(manifest_hash.as_str())
                    },
                )?;
                json!({
                    "kind": "frontend",
                    "status": "applied",
                    "checkedAt": &check_at,
                    "version": &version,
                    "details": applied,
                })
            }
        }
        Err(error) => {
            record_update_check(
                &check_at,
                Some(json!({
                    "kind": "frontend",
                    "status": "failed",
                    "checkedAt": &check_at,
                    "reason": "manifest-error",
                })),
                Some(error.clone()),
            )?;
            return Err(error);
        }
    };

    record_update_check(&check_at, Some(result), None)
}


fn apply_update_archive(
    bytes: &[u8],
    manifest: Option<&UpdateManifest>,
    expected_hash: Option<&str>,
) -> Result<Value, String> {
    let hash = sha256_hex(bytes);
    if let Some(expected_hash) = expected_hash {
        let expected = expected_hash.trim().strip_prefix("sha256:").unwrap_or(expected_hash.trim());
        if !expected.is_empty() && hash != expected {
            return Err(format!("哈希校验失败: 期望 {}，实际 {}", expected, hash));
        }
    }

    let final_dir = update_dir();
    let stage_dir = update_stage_dir();
    let backup_dir = update_backup_dir();
    let base_dir = final_dir
        .parent()
        .ok_or_else(|| "更新目录路径无效".to_string())?;
    fs::create_dir_all(base_dir).map_err(|e| format!("创建更新根目录失败: {e}"))?;

    if stage_dir.exists() {
        fs::remove_dir_all(&stage_dir).map_err(|e| format!("清理暂存目录失败: {e}"))?;
    }
    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|e| format!("清理备份目录失败: {e}"))?;
    }
    fs::create_dir_all(&stage_dir).map_err(|e| format!("创建暂存目录失败: {e}"))?;

    let file_count = extract_zip_to_dir(bytes, &stage_dir)?;
    if !stage_dir.join("index.html").exists() {
        let _ = fs::remove_dir_all(&stage_dir);
        return Err("更新包缺少 index.html".to_string());
    }

    let state = AppliedUpdateState {
        version: manifest.map(|item| item.version.clone()).unwrap_or_default(),
        hash: format!("sha256:{hash}"),
        url: manifest.map(|item| item.url.clone()).unwrap_or_default(),
        applied_at: now_iso(),
        file_count,
    };
    write_update_state_files(&stage_dir, &state)?;

    if final_dir.exists() {
        fs::rename(&final_dir, &backup_dir).map_err(|e| format!("备份旧版本失败: {e}"))?;
    }

    if let Err(err) = fs::rename(&stage_dir, &final_dir) {
        if backup_dir.exists() && !final_dir.exists() {
            let _ = fs::rename(&backup_dir, &final_dir);
        }
        let _ = fs::remove_dir_all(&stage_dir);
        return Err(format!("应用更新失败: {err}"));
    }

    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|e| format!("清理旧版本失败: {e}"))?;
    }

    Ok(json!({
        "success": true,
        "files": file_count,
        "path": final_dir.to_string_lossy(),
        "hash": state.hash,
        "version": state.version,
    }))
}

fn extract_zip_to_dir(bytes: &[u8], target_dir: &Path) -> Result<usize, String> {
    let cursor = std::io::Cursor::new(bytes);
    let mut archive = zip::ZipArchive::new(cursor).map_err(|e| format!("解压失败: {e}"))?;
    let mut extracted_files = 0usize;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("读取压缩条目失败: {e}"))?;
        let enclosed = file
            .enclosed_name()
            .map(|path| path.to_path_buf())
            .ok_or_else(|| format!("压缩包包含非法路径: {}", file.name()))?;
        validate_relative_path(&enclosed)?;
        let out_path = target_dir.join(&enclosed);

        if file.name().ends_with('/') {
            fs::create_dir_all(&out_path).map_err(|e| format!("创建目录失败: {e}"))?;
            continue;
        }

        if let Some(parent) = out_path.parent() {
            fs::create_dir_all(parent).map_err(|e| format!("创建父目录失败: {e}"))?;
        }

        let mut output = fs::File::create(&out_path).map_err(|e| format!("创建文件失败: {e}"))?;
        std::io::copy(&mut file, &mut output).map_err(|e| format!("写入文件失败: {e}"))?;
        output.flush().map_err(|e| format!("刷新文件失败: {e}"))?;
        extracted_files += 1;
    }

    Ok(extracted_files)
}

fn validate_relative_path(path: &Path) -> Result<(), String> {
    for component in path.components() {
        match component {
            Component::Normal(_) => {}
            _ => return Err(format!("压缩包包含非法路径: {}", path.display())),
        }
    }
    Ok(())
}

async fn fetch_manifest() -> Result<UpdateManifest, String> {
    let client = super::build_http_client(std::time::Duration::from_secs(10), Some("ClawPanel"))
        .map_err(|e| format!("HTTP 客户端错误: {e}"))?;

    let resp = client
        .get(LATEST_JSON_URL)
        .send()
        .await
        .map_err(|e| format!("请求失败: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("服务器返回 {}", resp.status()));
    }

    resp.json::<UpdateManifest>()
        .await
        .map_err(|e| format!("解析失败: {e}"))
}

fn read_update_settings() -> Result<UpdateSettings, String> {
    let panel = load_panel_config_value()?;
    let updates = panel.get("updates").cloned().unwrap_or_else(|| json!({}));
    Ok(UpdateSettings {
        mode: updates
            .get("mode")
            .and_then(|value| value.as_str())
            .unwrap_or("notify")
            .to_string(),
        frontend_enabled: updates
            .get("frontend")
            .and_then(|value| value.get("enabled"))
            .and_then(|value| value.as_bool())
            .unwrap_or(true),
        interval_minutes: updates
            .get("intervalMinutes")
            .and_then(|value| value.as_u64())
            .unwrap_or(DEFAULT_UPDATE_INTERVAL_MINUTES),
        require_hash_for_background: updates
            .get("requireHashForBackground")
            .and_then(|value| value.as_bool())
            .unwrap_or(true),
    })
}

fn load_panel_config_value() -> Result<Value, String> {
    let path = super::panel_config_path();
    if !path.exists() {
        return Ok(normalize_panel_config_value(json!({})));
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("读取面板配置失败: {e}"))?;
    let parsed = serde_json::from_str::<Value>(&content).map_err(|e| format!("解析面板配置失败: {e}"))?;
    Ok(normalize_panel_config_value(parsed))
}

fn save_panel_config_value(config: &Value) -> Result<(), String> {
    let path = super::panel_config_path();
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建配置目录失败: {e}"))?;
    }
    let normalized = normalize_panel_config_value(config.clone());
    let content = serde_json::to_string_pretty(&normalized)
        .map_err(|e| format!("序列化面板配置失败: {e}"))?;
    fs::write(&path, content).map_err(|e| format!("写入面板配置失败: {e}"))
}

fn record_update_check(check_at: &str, result: Option<Value>, error: Option<String>) -> Result<(), String> {
    let mut panel = load_panel_config_value()?;
    let root = panel
        .as_object_mut()
        .ok_or_else(|| "面板配置格式无效".to_string())?;
    let updates = root
        .entry("updates")
        .or_insert_with(|| json!({}))
        .as_object_mut()
        .ok_or_else(|| "updates 配置格式无效".to_string())?;

    updates.insert("lastCheckAt".into(), Value::String(check_at.to_string()));
    updates.insert("lastResult".into(), result.unwrap_or(Value::Null));
    updates.insert(
        "lastError".into(),
        error.map(Value::String).unwrap_or(Value::Null),
    );

    save_panel_config_value(&panel)
}

fn read_applied_update_state() -> Option<AppliedUpdateState> {
    let dir = update_dir();
    if !dir.join("index.html").exists() {
        return None;
    }

    let state_path = update_state_path(&dir);
    if let Ok(content) = fs::read_to_string(state_path) {
        if let Ok(state) = serde_json::from_str::<AppliedUpdateState>(&content) {
            return Some(state);
        }
    }

    let version = fs::read_to_string(update_version_path(&dir)).ok()?.trim().to_string();
    if version.is_empty() {
        None
    } else {
        Some(AppliedUpdateState {
            version,
            ..Default::default()
        })
    }
}

fn write_update_state_files(dir: &Path, state: &AppliedUpdateState) -> Result<(), String> {
    fs::write(update_version_path(dir), state.version.as_bytes())
        .map_err(|e| format!("写入版本文件失败: {e}"))?;
    let state_json =
        serde_json::to_string_pretty(state).map_err(|e| format!("序列化状态失败: {e}"))?;
    fs::write(update_state_path(dir), state_json).map_err(|e| format!("写入状态文件失败: {e}"))
}

fn sha256_hex(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    format!("{:x}", hasher.finalize())
}

fn now_iso() -> String {
    Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true)
}

/// 简单的语义化版本比较：current >= required
fn version_ge(current: &str, required: &str) -> bool {
    let parse = |s: &str| -> Vec<u32> {
        s.trim_start_matches('v')
            .split('.')
            .filter_map(|p| p.parse().ok())
            .collect()
    };
    let c = parse(current);
    let r = parse(required);
    for i in 0..r.len().max(c.len()) {
        let cv = c.get(i).copied().unwrap_or(0);
        let rv = r.get(i).copied().unwrap_or(0);
        if cv > rv {
            return true;
        }
        if cv < rv {
            return false;
        }
    }
    true
}

fn version_gt(left: &str, right: &str) -> bool {
    version_ge(left, right) && !version_ge(right, left)
}

/// 根据文件扩展名推断 MIME 类型
pub fn mime_from_path(path: &str) -> &'static str {
    match path.rsplit('.').next().unwrap_or("") {
        "html" => "text/html",
        "js" | "mjs" => "application/javascript",
        "css" => "text/css",
        "json" => "application/json",
        "png" => "image/png",
        "jpg" | "jpeg" => "image/jpeg",
        "gif" => "image/gif",
        "svg" => "image/svg+xml",
        "ico" => "image/x-icon",
        "woff" => "font/woff",
        "woff2" => "font/woff2",
        "ttf" => "font/ttf",
        "wasm" => "application/wasm",
        _ => "application/octet-stream",
    }
}
