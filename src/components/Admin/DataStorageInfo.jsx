import { useState } from 'react';
import { Button } from '../UI/Button';

export const DataStorageInfo = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getStorageInfo = () => {
        try {
            // Check IndexedDB
            const dbInfo = {
                name: 'PTCoachingDB',
                version: 9,
                stores: ['clients', 'exercises', 'workouts', 'measurements'],
            };

            // Check localStorage backups
            const localStorageKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('_backup')) {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        localStorageKeys.push({
                            key,
                            count: Array.isArray(data) ? data.length : 0,
                            size: new Blob([localStorage.getItem(key)]).size,
                        });
                    } catch {
                        // Skip invalid entries
                    }
                }
            }

            return { dbInfo, localStorageKeys };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return { dbInfo: null, localStorageKeys: [] };
        }
    };

    const storageInfo = getStorageInfo();

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getTotalStorageSize = () => {
        let total = 0;
        storageInfo.localStorageKeys.forEach(item => {
            total += item.size;
        });
        return formatBytes(total);
    };

    return (
        <div className="glass rounded-2xl p-6 border-2 border-purple-500/50">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Data Storage Information</h3>
                <Button
                    onClick={() => setIsExpanded(!isExpanded)}
                    variant="ghost"
                    size="sm"
                >
                    {isExpanded ? 'Hide' : 'Show Details'}
                </Button>
            </div>

            <div className="space-y-4">
                {/* Primary Storage */}
                <div>
                    <h4 className="text-sm font-semibold text-purple-400 mb-2">Primary Storage: IndexedDB</h4>
                    <div className="bg-white/5 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-200">Database Name:</span>
                            <span className="text-white font-mono">{storageInfo.dbInfo?.name || 'PTCoachingDB'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-200">Version:</span>
                            <span className="text-white">{storageInfo.dbInfo?.version || 9}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-200">Data Stores:</span>
                            <span className="text-white">{storageInfo.dbInfo?.stores.join(', ') || 'clients, exercises, workouts, measurements'}</span>
                        </div>
                        <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-gray-200">
                                <strong className="text-yellow-400">⚠️ Browser-Specific:</strong> IndexedDB is stored locally in each browser. 
                                Data in Chrome won't appear in Firefox, Edge, etc.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Backup Storage */}
                <div>
                    <h4 className="text-sm font-semibold text-teal-400 mb-2">Backup Storage: localStorage</h4>
                    {storageInfo.localStorageKeys.length > 0 ? (
                        <div className="bg-white/5 rounded-lg p-4 space-y-2">
                            {storageInfo.localStorageKeys.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-200">{item.key.replace('_backup', '')}:</span>
                                    <span className="text-white">
                                        {item.count} items ({formatBytes(item.size)})
                                    </span>
                                </div>
                            ))}
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-200 font-semibold">Total Backup Size:</span>
                                    <span className="text-white font-semibold">{getTotalStorageSize()}</span>
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-white/10">
                                <p className="text-xs text-gray-200">
                                    <strong className="text-yellow-400">⚠️ Browser-Specific:</strong> localStorage backups are also browser-specific. 
                                    Use Export/Import to transfer data between browsers.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 rounded-lg p-4">
                            <p className="text-sm text-gray-200">No localStorage backups found</p>
                        </div>
                    )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-semibold text-blue-400 mb-3">Storage Details</h4>
                        <div className="space-y-3 text-sm">
                            <div className="bg-white/5 rounded-lg p-4">
                                <h5 className="font-semibold text-white mb-2">📍 Physical Location</h5>
                                <p className="text-gray-100 mb-2">
                                    Your data is stored in your browser's local storage directory:
                                </p>
                                <ul className="list-disc list-inside text-gray-200 space-y-1 ml-2">
                                    <li><strong>Chrome/Edge:</strong> <code className="text-xs">%LocalAppData%\Google\Chrome\User Data\Default\IndexedDB</code></li>
                                    <li><strong>Firefox:</strong> <code className="text-xs">%AppData%\Mozilla\Firefox\Profiles\[profile]\storage\default</code></li>
                                    <li><strong>Safari:</strong> <code className="text-xs">~/Library/Safari/LocalStorage</code></li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <h5 className="font-semibold text-white mb-2">🔄 How Data Persists</h5>
                                <ol className="list-decimal list-inside text-gray-100 space-y-2 ml-2">
                                    <li><strong>Primary:</strong> All data is saved to IndexedDB immediately when you create/edit/delete items</li>
                                    <li><strong>Backup:</strong> After each save, a backup is automatically created in localStorage</li>
                                    <li><strong>Recovery:</strong> If IndexedDB fails, the app automatically tries to restore from localStorage backups</li>
                                </ol>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <h5 className="font-semibold text-white mb-2">🚨 Important Limitations</h5>
                                <ul className="list-disc list-inside text-gray-100 space-y-2 ml-2">
                                    <li><strong>Browser-Specific:</strong> Each browser has its own storage. Chrome data ≠ Firefox data</li>
                                    <li><strong>Device-Specific:</strong> Data is stored on the device. Different computers = different data</li>
                                    <li><strong>No Cloud Sync:</strong> Data is only stored locally. No automatic cloud backup</li>
                                    <li><strong>Clear Data Warning:</strong> Clearing browser data will delete your app data</li>
                                </ul>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4">
                                <h5 className="font-semibold text-white mb-2">💾 Backup Recommendations</h5>
                                <ul className="list-disc list-inside text-gray-100 space-y-2 ml-2">
                                    <li><strong>Regular Exports:</strong> Use "Export All Data" weekly/monthly to create JSON backup files</li>
                                    <li><strong>Multiple Browsers:</strong> Export from one browser, import into another to sync</li>
                                    <li><strong>External Backup:</strong> Save exported JSON files to cloud storage (Google Drive, OneDrive, etc.)</li>
                                    <li><strong>Before Updates:</strong> Always export before clearing browser cache or updating the app</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
