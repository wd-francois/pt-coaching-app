import { useState, useRef, useEffect } from 'react';
import { Button } from '../UI/Button';
import { ClientForm } from './ClientForm';
import { Modal } from '../UI/Modal';
import { MeasurementsForm } from './MeasurementsForm';
import { MeasurementsList } from './MeasurementsList';
import * as XLSX from 'xlsx';

export const ClientList = ({ clients, onAdd, onUpdate, onDelete, onImportBatch, onCreateMeasurement, onUpdateMeasurement, onDeleteMeasurement, getMeasurementsByClient, onViewClient }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportResult, setExportResult] = useState(null);
    const [importing, setImporting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [clientMeasurements, setClientMeasurements] = useState({});
    const [clientPersonalBests, setClientPersonalBests] = useState({});
    const [showMeasurementsForm, setShowMeasurementsForm] = useState({});
    const [editingMeasurement, setEditingMeasurement] = useState({});
    const fileInputRef = useRef(null);
    const exportMenuRef = useRef(null);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAdd = async (clientData) => {
        await onAdd(clientData);
        setIsFormOpen(false);
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setIsFormOpen(true);
    };

    const handleUpdate = async (clientData) => {
        await onUpdate(editingClient.id, clientData);
        setEditingClient(null);
        setIsFormOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this client?')) {
            await onDelete(id);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingClient(null);
    };


    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const handleShowMeasurementsForm = (clientId, measurement = null) => {
        setShowMeasurementsForm(prev => ({ ...prev, [clientId]: true }));
        if (measurement) {
            setEditingMeasurement(prev => ({ ...prev, [clientId]: measurement }));
        } else {
            setEditingMeasurement(prev => ({ ...prev, [clientId]: null }));
        }
    };

    const handleCloseMeasurementsForm = (clientId) => {
        setShowMeasurementsForm(prev => ({ ...prev, [clientId]: false }));
        setEditingMeasurement(prev => ({ ...prev, [clientId]: null }));
    };

    const handleMeasurementSubmit = async (clientId, measurementData) => {
        try {
            if (editingMeasurement[clientId]) {
                await onUpdateMeasurement(editingMeasurement[clientId].id, {
                    ...measurementData,
                    clientId,
                });
            } else {
                await onCreateMeasurement({
                    ...measurementData,
                    clientId,
                });
            }
            // Reload measurements
            const measurements = await getMeasurementsByClient(clientId);
            setClientMeasurements(prev => ({ ...prev, [clientId]: measurements }));
            handleCloseMeasurementsForm(clientId);
        } catch (error) {
            console.error('Error saving measurement:', error);
        }
    };

    const handleDeleteMeasurement = async (clientId, measurementId) => {
        try {
            await onDeleteMeasurement(measurementId);
            // Reload measurements
            const measurements = await getMeasurementsByClient(clientId);
            setClientMeasurements(prev => ({ ...prev, [clientId]: measurements }));
        } catch (error) {
            console.error('Error deleting measurement:', error);
        }
    };

    // Close export menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setShowExportMenu(false);
            }
        };

        if (showExportMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showExportMenu]);

    const exportToJSON = () => {
        const dataStr = JSON.stringify(clients, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clients-database-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportResult({
            success: true,
            count: clients.length,
            message: `Exported ${clients.length} client${clients.length !== 1 ? 's' : ''} to JSON file!`,
        });
        setTimeout(() => setExportResult(null), 5000);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Phone', 'Notes'];
        const csvRows = [headers.join(',')];
        
        clients.forEach(client => {
            const row = [
                `"${(client.name || '').replace(/"/g, '""')}"`,
                `"${(client.email || '').replace(/"/g, '""')}"`,
                `"${(client.phone || '').replace(/"/g, '""')}"`,
                `"${(client.notes || '').replace(/"/g, '""')}"`,
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clients-database-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setExportResult({
            success: true,
            count: clients.length,
            message: `Exported ${clients.length} client${clients.length !== 1 ? 's' : ''} to CSV file!`,
        });
        setTimeout(() => setExportResult(null), 5000);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            clients.map(client => ({
                'Name': client.name || '',
                'Email': client.email || '',
                'Phone': client.phone || '',
                'Notes': client.notes || '',
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Clients');
        XLSX.writeFile(workbook, `clients-database-${new Date().toISOString().split('T')[0]}.xlsx`);
        
        setExportResult({
            success: true,
            count: clients.length,
            message: `Exported ${clients.length} client${clients.length !== 1 ? 's' : ''} to Excel file!`,
        });
        setTimeout(() => setExportResult(null), 5000);
    };

    const normalizeColumnName = (name) => {
        if (!name) return '';
        return name.toLowerCase().trim().replace(/[_\s]+/g, ' ');
    };

    const findColumnIndex = (headers, possibleNames) => {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => 
                normalizeColumnName(h).includes(normalizeColumnName(name)) ||
                normalizeColumnName(name).includes(normalizeColumnName(h))
            );
            if (index !== -1) return index;
        }
        return -1;
    };

    const parseClientFile = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // Get first sheet
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    // Convert to JSON
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    if (jsonData.length < 2) {
                        reject(new Error('File must have at least a header row and one data row'));
                        return;
                    }
                    
                    // First row is headers
                    const headers = jsonData[0].map(h => String(h || '').trim());
                    
                    // Find column indices
                    const nameIndex = findColumnIndex(headers, ['name', 'client name', 'client', 'full name']);
                    const emailIndex = findColumnIndex(headers, ['email', 'e-mail', 'email address']);
                    const phoneIndex = findColumnIndex(headers, ['phone', 'telephone', 'mobile', 'phone number']);
                    const notesIndex = findColumnIndex(headers, ['notes', 'note', 'description', 'comments']);
                    
                    if (nameIndex === -1) {
                        reject(new Error('Could not find a "Name" column. Please ensure your file has a "Name" column.'));
                        return;
                    }
                    
                    // Parse rows (skip header)
                    const clients = [];
                    
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        const name = String(row[nameIndex] || '').trim();
                        
                        if (!name) continue; // Skip empty rows
                        
                        const client = {
                            name,
                            email: emailIndex !== -1 ? String(row[emailIndex] || '').trim() : '',
                            phone: phoneIndex !== -1 ? String(row[phoneIndex] || '').trim() : '',
                            notes: notesIndex !== -1 ? String(row[notesIndex] || '').trim() : '',
                        };
                        
                        clients.push(client);
                    }
                    
                    if (clients.length === 0) {
                        reject(new Error('No valid clients found in the file'));
                        return;
                    }
                    
                    resolve(clients);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Reset file input
        e.target.value = '';
        
        setImporting(true);
        setExportResult(null);
        
        try {
            const clients = await parseClientFile(file);
            
            if (onImportBatch) {
                await onImportBatch(clients);
                setExportResult({
                    success: true,
                    count: clients.length,
                    message: `Successfully imported ${clients.length} client${clients.length !== 1 ? 's' : ''}!`,
                });
            } else {
                // Fallback: add clients one by one
                for (const client of clients) {
                    await onAdd(client);
                }
                setExportResult({
                    success: true,
                    count: clients.length,
                    message: `Successfully imported ${clients.length} client${clients.length !== 1 ? 's' : ''}!`,
                });
            }
            
            setIsImportModalOpen(false);
            setTimeout(() => setExportResult(null), 5000);
        } catch (error) {
            setExportResult({
                success: false,
                message: error.message || 'Failed to import clients. Expected format: Name, Email, Phone, Notes',
            });
            setTimeout(() => setExportResult(null), 5000);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Clients</h1>
                    <p className="text-gray-200 mt-1">{clients.length} total clients</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Button
                        onClick={() => setIsImportModalOpen(true)}
                        variant="secondary"
                        disabled={importing}
                        loading={importing}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        }
                    >
                        Import
                    </Button>
                    {clients.length > 0 && (
                        <div className="relative" ref={exportMenuRef}>
                            <Button
                                onClick={() => setShowExportMenu(!showExportMenu)}
                                variant="secondary"
                                icon={
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                }
                            >
                                Export
                            </Button>
                            {showExportMenu && (
                                <div className="absolute right-0 top-full mt-2 w-48 glass rounded-lg shadow-xl z-10">
                                    <div className="p-2 space-y-1">
                                        <button
                                            onClick={() => {
                                                exportToExcel();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export as Excel
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportToCSV();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export as CSV
                                        </button>
                                        <button
                                            onClick={() => {
                                                exportToJSON();
                                                setShowExportMenu(false);
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Export as JSON
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        }
                    >
                        Add Client
                    </Button>
                </div>
            </div>

            {/* Export Result Message */}
            {exportResult && (
                <div className={`glass rounded-lg p-4 flex items-center gap-3 ${
                    exportResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                    {exportResult.success ? (
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <div className="flex-1">
                        <p className={`font-medium ${exportResult.success ? 'text-green-300' : 'text-red-300'}`}>
                            {exportResult.message}
                        </p>
                    </div>
                    <button
                        onClick={() => setExportResult(null)}
                        aria-label="Close notification"
                        className="text-gray-200 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Search */}
            <div className="glass rounded-lg p-4">
                <input
                    type="text"
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-400"
                />
            </div>

            {/* Client Grid */}
            {filteredClients.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        {searchTerm ? 'No clients found' : 'No clients yet'}
                    </h3>
                    <p className="text-gray-200 mb-6">
                        {searchTerm ? 'Try a different search term' : 'Get started by adding your first client'}
                    </p>
                    {!searchTerm && (
                        <Button onClick={() => setIsFormOpen(true)}>Add Your First Client</Button>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredClients.map(client => {
                        return (
                            <div 
                                key={client.id} 
                                className="glass glass-hover rounded-lg overflow-hidden"
                            >
                                {/* Client Card - Clickable */}
                                <button
                                    onClick={() => onViewClient ? onViewClient(client.id) : null}
                                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                                    aria-label={`${client.name}. Click to view profile`}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-12 h-12 rounded-full bg-purple-600/30 flex items-center justify-center">
                                            <span className="text-purple-400 font-semibold text-lg">
                                                {client.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="text-left flex-1">
                                            <div className="font-semibold text-white">{client.name}</div>
                                            {(client.email || client.phone) && (
                                                <div className="text-sm text-hc-textSecondary">
                                                    {client.email || client.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(client);
                                            }}
                                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                            aria-label={`Edit ${client.name}`}
                                            title="Edit client"
                                        >
                                            <svg className="w-5 h-5 text-gray-200 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(client.id);
                                            }}
                                            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                                            aria-label={`Delete ${client.name}`}
                                            title="Delete client"
                                        >
                                            <svg className="w-5 h-5 text-gray-200 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                        <svg 
                                            className="w-5 h-5 text-gray-200 transition-transform flex-shrink-0" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Form Modal */}
            <ClientForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={editingClient ? handleUpdate : handleAdd}
                initialData={editingClient}
            />

            {/* Import Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                }}
                title="Import Clients"
                size="md"
            >
                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-200 mb-3">
                            Upload an Excel (.xlsx, .xls), ODS (.ods), or CSV file with columns: <strong>Name, Email, Phone, Notes</strong>
                        </p>
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv,.ods"
                                onChange={handleFileChange}
                                className="hidden"
                                id="client-file-input"
                            />
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (fileInputRef.current) {
                                        fileInputRef.current.click();
                                    }
                                }}
                                disabled={importing}
                                className="w-full px-4 py-2 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                            >
                                {importing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Importing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        Choose File
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="glass rounded-lg p-4 text-sm text-gray-100">
                        <p className="font-semibold mb-2">Example format:</p>
                        <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto">
{`Name,Email,Phone,Notes
John Doe,john@example.com,+1 555-1234,Regular client
Jane Smith,jane@example.com,+1 555-5678,Prefers morning sessions`}
                        </pre>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
