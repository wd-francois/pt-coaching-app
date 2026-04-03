# Fixing OneDrive Permission Issues

If you're getting `EPERM: operation not permitted` errors, it's likely because OneDrive is syncing your project folder and locking files.

## Quick Fix

The Vite cache has been cleared. Try running `npm run tauri:dev` again.

## Permanent Solution: Exclude node_modules from OneDrive

### Option 1: Exclude via OneDrive Settings

1. Right-click the OneDrive icon in the system tray
2. Click **Settings** → **Sync and backup** → **Advanced settings**
3. Click **Choose folders**
4. Uncheck `node_modules` folders in your projects

### Option 2: Move Project Outside OneDrive

Move your project to a location outside OneDrive:
- `C:\Projects\pt-coaching-app`
- `C:\Dev\pt-coaching-app`
- `D:\Projects\pt-coaching-app` (if you have another drive)

### Option 3: Use .onedriveignore (if available)

Create a `.onedriveignore` file in your project root:
```
node_modules/
.vite/
dist/
src-tauri/target/
```

## Temporary Workaround

If you need to keep the project in OneDrive:

1. **Pause OneDrive sync** before running dev commands:
   - Right-click OneDrive icon → **Pause syncing** → **2 hours**

2. **Run your commands**, then resume syncing

## Why This Happens

- OneDrive locks files while syncing
- Vite needs to delete/rewrite cache files
- Windows file system prevents deletion of locked files
- Result: Permission errors

## Best Practice

For development projects, it's recommended to:
- Keep projects **outside** OneDrive
- Use Git for version control instead
- Only sync important documents via OneDrive
