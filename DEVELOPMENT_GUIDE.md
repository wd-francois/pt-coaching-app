# Development Guide for PT Coach App

## Making Changes to the App

### Frontend Changes (React/JavaScript)

1. **Edit your code** in the `src/` directory:
   - Components: `src/components/`
   - Hooks: `src/hooks/`
   - Utils: `src/utils/`
   - Styles: CSS/Tailwind classes

2. **Hot Reload**:
   - If `npm run tauri:dev` is running, changes will **automatically reload** in the desktop window
   - No need to restart - just save your file and the app will update

3. **Testing changes**:
   - The desktop window will automatically refresh when you save files
   - Check the browser console (if visible) or terminal for any errors

### Backend Changes (Rust/Tauri)

1. **Edit Rust code** in `src-tauri/src/`:
   - Main entry: `src-tauri/src/main.rs`
   - Add new commands in Rust files

2. **Restart required**:
   - Stop the dev server (Ctrl+C)
   - Run `npm run tauri:dev` again
   - Rust changes require a full recompile

### Configuration Changes

- **Tauri config**: `src-tauri/tauri.conf.json` - restart required
- **Vite config**: `vite.config.js` - restart required
- **Package.json**: Run `npm install` if you add dependencies

### Development Workflow

```bash
# Start development server (if not already running)
npm run tauri:dev

# Make changes to React/JavaScript files
# → Changes auto-reload in the desktop window

# For Rust/Tauri changes:
# 1. Stop the server (Ctrl+C)
# 2. Restart: npm run tauri:dev
```

---

## Where is Your Data Stored?

### In Tauri Desktop App

Your data is stored in **two locations** for redundancy:

#### 1. **IndexedDB** (Primary Storage)
- **Location**: App's data directory
- **Database Name**: `PTCoachingDB`
- **Platform-specific paths**:
  - **Windows**: `%APPDATA%\PT Coach\` 
    - Full path: `C:\Users\[YourUsername]\AppData\Roaming\PT Coach\`
  - **macOS**: `~/Library/Application Support/com.ptcoach.app/`
  - **Linux**: `~/.local/share/com.ptcoach.app/`

#### 2. **localStorage** (Backup Storage)
- **Location**: Same app data directory as IndexedDB
- **Purpose**: Automatic backup of your data
- **Backed up data**:
  - `clients_backup`
  - `exercises_backup`
  - `workouts_backup`
  - `measurements_backup`

### Data Structure

Your app stores:
- **Clients**: Client information and profiles
- **Exercises**: Exercise library
- **Workouts**: Workout sessions and history
- **Measurements**: Client measurements and progress

### Accessing Your Data

#### Windows:
1. Press `Win + R`
2. Type: `%APPDATA%\PT Coach`
3. Press Enter
4. Look for IndexedDB files (they may be in a subfolder)

#### Finding the exact location:
- The data is stored by Chromium (Tauri's webview)
- It's in a hidden/system folder
- **Important**: Don't manually edit these files - use the app's export/import features

### Data Persistence

✅ **Your data persists**:
- When you close and reopen the app
- When you restart your computer
- When you update the app (unless you uninstall)

⚠️ **Data is per-installation**:
- If you uninstall and reinstall, you'll lose data
- **Solution**: Use the Export feature in the Statistics page before uninstalling

### Backup Recommendations

1. **Use the built-in Export feature**:
   - Go to Statistics page
   - Click "Export Data"
   - Save the JSON file somewhere safe

2. **Regular backups**:
   - Export your data weekly/monthly
   - Store backups in cloud storage (OneDrive, Google Drive, etc.)

3. **Before major changes**:
   - Always export before updating the app
   - Keep multiple backup versions

### Data Recovery

If you lose data:
1. Check if you have an exported backup file
2. Use the Import feature in the Statistics page
3. The app also tries to restore from localStorage backups automatically

---

## Quick Reference

### Development Commands

```bash
# Start development (with hot reload)
npm run tauri:dev

# Build for production
npm run tauri:build

# Regular web dev (without Tauri)
npm run dev

# Build web version
npm run build
```

### Data Locations Summary

| Platform | IndexedDB Location |
|----------|-------------------|
| Windows  | `%APPDATA%\PT Coach\` |
| macOS    | `~/Library/Application Support/com.ptcoach.app/` |
| Linux    | `~/.local/share/com.ptcoach.app/` |

### Tips

- ✅ **Always export before uninstalling**
- ✅ **Make regular backups** of your exported data
- ✅ **Frontend changes** = automatic reload
- ✅ **Backend changes** = restart required
- ⚠️ **Don't manually edit** IndexedDB files
- ⚠️ **Data is local** - not synced to cloud automatically
