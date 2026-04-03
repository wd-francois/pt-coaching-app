import { useState, useRef, useEffect } from 'react';
import { Button } from '../UI/Button';
import { ExerciseForm } from './ExerciseForm';
import { Modal } from '../UI/Modal';
import * as XLSX from 'xlsx';

export const ExerciseList = ({ exercises, onAdd, onUpdate, onDelete, onImportBatch }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [selectedEquipmentTags, setSelectedEquipmentTags] = useState([]);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importMethod, setImportMethod] = useState('file'); // 'file', 'paste', 'json'
    const [pasteText, setPasteText] = useState('');
    const [jsonText, setJsonText] = useState('');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const fileInputRef = useRef(null);
    const exportMenuRef = useRef(null);

    // Debug: Log exercises on mount or when exercises change
    useEffect(() => {
        console.log('Exercises loaded:', exercises.length);
        if (exercises.length > 0) {
            console.log('Sample exercise:', exercises[0]);
        }
    }, [exercises]);

    const categories = ['All', ...new Set(exercises.map(e => e?.category).filter(cat => cat && cat !== 'Other'))];
    
    // Get all unique equipment tags from exercises
    const allEquipmentTags = Array.from(new Set(
        exercises.flatMap(ex => 
            Array.isArray(ex?.equipment) ? ex.equipment : (ex?.equipment ? [ex.equipment] : [])
        )
    )).sort();

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

    const filteredExercises = exercises.filter(exercise => {
        if (!exercise) return false;
        if (!exercise.name) return false;
        
        const matchesSearch = !searchTerm || 
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exercise.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || exercise.category === filterCategory;
        
        // Filter by equipment tags
        const matchesEquipment = selectedEquipmentTags.length === 0 || 
            selectedEquipmentTags.every(tag => {
                const exerciseEquipment = Array.isArray(exercise.equipment) 
                    ? exercise.equipment 
                    : (exercise.equipment ? [exercise.equipment] : []);
                return exerciseEquipment.includes(tag);
            });
        
        return matchesSearch && matchesCategory && matchesEquipment;
    });

    const handleAdd = async (exerciseData) => {
        await onAdd(exerciseData);
        setIsFormOpen(false);
    };

    const handleEdit = (exercise) => {
        setEditingExercise(exercise);
        setIsFormOpen(true);
    };

    const handleUpdate = async (exerciseData) => {
        await onUpdate(editingExercise.id, exerciseData);
        setEditingExercise(null);
        setIsFormOpen(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this exercise?')) {
            await onDelete(id);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingExercise(null);
    };

    const handleImportClick = () => {
        setIsImportModalOpen(true);
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

    const parseCSVText = (text) => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length < 2) {
            throw new Error('CSV text must have at least a header row and one data row');
        }

        // Detect delimiter (tab first, then comma)
        const firstLine = lines[0];
        const delimiter = firstLine.includes('\t') ? '\t' : ',';
        
        // Simple CSV parser that handles quoted values
        const parseCSVLine = (line) => {
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if ((char === delimiter || char === '\t') && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };
        
        // Parse header
        const headers = parseCSVLine(lines[0]).map(h => h.replace(/^["']|["']$/g, ''));
        
        // Find column indices
        const nameIndex = findColumnIndex(headers, ['name', 'exercise name', 'exercise', 'title']);
        const bodyPartIndex = findColumnIndex(headers, ['body part', 'bodypart', 'body', 'part']);
        const videoUrlIndex = findColumnIndex(headers, ['video demonstration', 'video', 'demonstration', 'video url', 'url', 'link', 'youtube']);
        
        if (nameIndex === -1) {
            throw new Error('Could not find a "Name" column. Expected format: Name, Body Part, Video Demonstration');
        }

        const exercises = [];
        const validCategories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometrics', 'Core', 'Other'];
        const validEquipmentTags = ['Barbell', 'Bodyweight', 'Dumbbell', 'Cable', 'Machine', 'EZ Bar', 'Landmine', 'Band', 'Kettlebell', 'Resistance Band', 'TRX', 'Medicine Ball', 'Plate', 'Smith Machine', 'Pulley'];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]).map(v => v.replace(/^["']|["']$/g, ''));
            const name = values[nameIndex]?.trim() || '';
            
            if (!name) continue;

            // Get category
            let category = 'Other';
            if (bodyPartIndex !== -1 && values[bodyPartIndex]) {
                const categoryValue = values[bodyPartIndex].trim();
                category = validCategories.includes(categoryValue) ? categoryValue : 'Other';
            }

            // Get equipment tags
            let equipment = [];
            const equipmentIndex = findColumnIndex(headers, ['equipment', 'equipment tag', 'equipment tags', 'tag', 'tags', 'tool']);
            if (equipmentIndex !== -1 && values[equipmentIndex]) {
                const equipmentValue = values[equipmentIndex].trim();
                const tags = equipmentValue.split(/[,;]/).map(t => t.trim()).filter(t => t);
                equipment = tags.filter(tag => validEquipmentTags.includes(tag));
            }

            exercises.push({
                name,
                category,
                description: '',
                videoUrl: videoUrlIndex !== -1 ? (values[videoUrlIndex]?.trim() || '') : '',
                equipment,
            });
        }

        if (exercises.length === 0) {
            throw new Error('No valid exercises found in the pasted text');
        }

        return exercises;
    };

    const parseJSONText = (text) => {
        try {
            const data = JSON.parse(text);
            const exercises = Array.isArray(data) ? data : [data];
            const validCategories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometrics', 'Core', 'Other'];

            return exercises.map(ex => ({
                name: ex.name || ex.Name || '',
                category: validCategories.includes(ex.category || ex.Category || ex['Body Part'] || ex['BodyPart']) 
                    ? (ex.category || ex.Category || ex['Body Part'] || ex['BodyPart'] || 'Other')
                    : 'Other',
                description: ex.description || ex.Description || '',
                videoUrl: ex.videoUrl || ex.video || ex['Video Demonstration'] || ex['VideoDemonstration'] || ex.url || '',
            })).filter(ex => ex.name);
        } catch {
            throw new Error('Invalid JSON format. Please check your JSON syntax.');
        }
    };

    const parseExcelFile = (file) => {
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
                        reject(new Error('Excel file must have at least a header row and one data row'));
                        return;
                    }
                    
                    // First row is headers
                    const headers = jsonData[0].map(h => String(h || '').trim());
                    
                    // Find column indices - Support multiple formats
                    const nameIndex = findColumnIndex(headers, ['name', 'exercise name', 'exercise', 'title', 'exercise name']);
                    const categoryIndex = findColumnIndex(headers, ['category', 'body part', 'bodypart', 'body', 'part', 'type']);
                    const equipmentIndex = findColumnIndex(headers, ['equipment', 'equipment tag', 'equipment tags', 'tag', 'tags', 'tool']);
                    const videoUrlIndex = findColumnIndex(headers, ['video demonstration', 'video', 'demonstration', 'video url', 'url', 'link', 'youtube', 'video link']);
                    const descriptionIndex = findColumnIndex(headers, ['description', 'desc', 'instructions', 'notes']);
                    
                    if (nameIndex === -1) {
                        reject(new Error('Could not find a "Name" column in the file. Please ensure your file has a "Name" column.'));
                        return;
                    }
                    
                    // Parse rows (skip header)
                    const exercises = [];
                    const validCategories = ['Strength', 'Cardio', 'Flexibility', 'Balance', 'Plyometrics', 'Core', 'Other'];
                    const validEquipmentTags = ['Barbell', 'Bodyweight', 'Dumbbell', 'Cable', 'Machine', 'EZ Bar', 'Landmine', 'Band', 'Kettlebell', 'Resistance Band', 'TRX', 'Medicine Ball', 'Plate', 'Smith Machine', 'Pulley'];
                    
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        const name = String(row[nameIndex] || '').trim();
                        
                        if (!name) continue; // Skip empty rows
                        
                        // Get category
                        let category = 'Other';
                        if (categoryIndex !== -1 && row[categoryIndex]) {
                            const categoryValue = String(row[categoryIndex]).trim();
                            category = validCategories.includes(categoryValue) ? categoryValue : 'Other';
                        }
                        
                        // Get equipment tags
                        let equipment = [];
                        if (equipmentIndex !== -1 && row[equipmentIndex]) {
                            const equipmentValue = String(row[equipmentIndex]).trim();
                            // Handle comma or semicolon separated tags
                            const tags = equipmentValue.split(/[,;]/).map(t => t.trim()).filter(t => t);
                            equipment = tags.filter(tag => validEquipmentTags.includes(tag));
                        }
                        
                        // Get video URL
                        const videoUrl = videoUrlIndex !== -1 ? String(row[videoUrlIndex] || '').trim() : '';
                        
                        // Get description
                        const description = descriptionIndex !== -1 ? String(row[descriptionIndex] || '').trim() : '';
                        
                        const exercise = {
                            name,
                            category,
                            description,
                            videoUrl,
                            equipment,
                        };
                        
                        exercises.push(exercise);
                    }
                    
                    if (exercises.length === 0) {
                        reject(new Error('No valid exercises found in the Excel file'));
                        return;
                    }
                    
                    resolve(exercises);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    const processImport = async (exercises) => {
        if (onImportBatch) {
            await onImportBatch(exercises);
        } else {
            // Fallback: add exercises one by one
            for (const exercise of exercises) {
                await onAdd(exercise);
            }
        }
        
        setImportResult({
            success: true,
            count: exercises.length,
            message: `Successfully imported ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}!`,
        });
        
        // Clear result after 5 seconds
        setTimeout(() => setImportResult(null), 5000);
        setIsImportModalOpen(false);
        setPasteText('');
        setJsonText('');
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        // Reset file input
        e.target.value = '';
        
        setImporting(true);
        setImportResult(null);
        
        try {
            const exercises = await parseExcelFile(file);
            await processImport(exercises);
        } catch (error) {
            setImportResult({
                success: false,
                message: error.message || 'Failed to import exercises. Expected format: Name, Body Part, Video Demonstration',
            });
            setTimeout(() => setImportResult(null), 5000);
        } finally {
            setImporting(false);
        }
    };

    const handlePasteImport = async () => {
        if (!pasteText.trim()) {
            setImportResult({
                success: false,
                message: 'Please paste your CSV/TSV data',
            });
            setTimeout(() => setImportResult(null), 5000);
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            const exercises = parseCSVText(pasteText);
            await processImport(exercises);
        } catch (error) {
            setImportResult({
                success: false,
                message: error.message || 'Failed to parse CSV/TSV data. Expected format: Name, Body Part, Video Demonstration',
            });
            setTimeout(() => setImportResult(null), 5000);
        } finally {
            setImporting(false);
        }
    };

    const handleJSONImport = async () => {
        if (!jsonText.trim()) {
            setImportResult({
                success: false,
                message: 'Please paste your JSON data',
            });
            setTimeout(() => setImportResult(null), 5000);
            return;
        }

        setImporting(true);
        setImportResult(null);

        try {
            const exercises = parseJSONText(jsonText);
            if (exercises.length === 0) {
                throw new Error('No valid exercises found in JSON');
            }
            await processImport(exercises);
        } catch (error) {
            setImportResult({
                success: false,
                message: error.message || 'Failed to parse JSON data',
            });
            setTimeout(() => setImportResult(null), 5000);
        } finally {
            setImporting(false);
        }
    };

    const exportToJSON = () => {
        const dataStr = JSON.stringify(exercises, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exercise-database-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setImportResult({
            success: true,
            count: exercises.length,
            message: `Exported ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} to JSON file!`,
        });
        setTimeout(() => setImportResult(null), 5000);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Category', 'Equipment', 'Video Demonstration', 'Description'];
        const csvRows = [headers.join(',')];
        
        exercises.forEach(exercise => {
            const equipmentStr = Array.isArray(exercise.equipment) 
                ? exercise.equipment.join(', ') 
                : (exercise.equipment || '');
            const row = [
                `"${(exercise.name || '').replace(/"/g, '""')}"`,
                `"${(exercise.category || '').replace(/"/g, '""')}"`,
                `"${equipmentStr.replace(/"/g, '""')}"`,
                `"${(exercise.videoUrl || '').replace(/"/g, '""')}"`,
                `"${(exercise.description || '').replace(/"/g, '""')}"`,
            ];
            csvRows.push(row.join(','));
        });
        
        const csvContent = csvRows.join('\n');
        const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `exercise-database-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setImportResult({
            success: true,
            count: exercises.length,
            message: `Exported ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} to CSV file!`,
        });
        setTimeout(() => setImportResult(null), 5000);
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(
            exercises.map(ex => ({
                'Name': ex.name,
                'Category': ex.category,
                'Equipment': Array.isArray(ex.equipment) ? ex.equipment.join(', ') : (ex.equipment || ''),
                'Video Demonstration': ex.videoUrl || '',
                'Description': ex.description || '',
            }))
        );
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Exercises');
        XLSX.writeFile(workbook, `exercise-database-${new Date().toISOString().split('T')[0]}.xlsx`);
        
        setImportResult({
            success: true,
            count: exercises.length,
            message: `Exported ${exercises.length} exercise${exercises.length !== 1 ? 's' : ''} to Excel file!`,
        });
        setTimeout(() => setImportResult(null), 5000);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text">Exercise Database</h1>
                    <p className="text-gray-400 mt-1">
                        {exercises.length} total exercises
                        {filteredExercises.length !== exercises.length && (
                            <span className="ml-2 text-purple-400">
                                ({filteredExercises.length} shown)
                            </span>
                        )}
                    </p>
                    {(searchTerm || filterCategory !== 'All' || selectedEquipmentTags.length > 0) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setFilterCategory('All');
                                setSelectedEquipmentTags([]);
                            }}
                            className="mt-2 text-sm text-purple-400 hover:text-purple-300 underline"
                        >
                            Clear all filters
                        </button>
                    )}
                </div>
                <div className="flex gap-3 flex-wrap">
                    <Button
                        onClick={handleImportClick}
                        variant="secondary"
                        disabled={importing}
                        icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        }
                    >
                        Import
                    </Button>
                    {exercises.length > 0 && (
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
                        Add Exercise
                    </Button>
                </div>
            </div>

            {/* Import Result Message */}
            {importResult && (
                <div className={`glass rounded-lg p-4 flex items-center gap-3 ${
                    importResult.success ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                    {importResult.success ? (
                        <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    <div className="flex-1">
                        <p className={`font-medium ${importResult.success ? 'text-green-300' : 'text-red-300'}`}>
                            {importResult.message}
                        </p>
                        {importResult.success && importResult.count > 0 && (
                            <p className="text-sm text-gray-400 mt-1">
                                Your exercise library now has {exercises.length} total exercises.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={() => setImportResult(null)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            {/* Filters */}
            <div className="glass rounded-lg p-4 space-y-4">
                <input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none focus:outline-none text-white placeholder-gray-400"
                />

                <div>
                    <p className="text-xs text-gray-400 mb-2">Filters</p>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-3 py-1 rounded-full text-sm transition-all ${filterCategory === cat
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                        {allEquipmentTags.length > 0 && allEquipmentTags.map(tag => {
                            const isSelected = selectedEquipmentTags.includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => {
                                        if (isSelected) {
                                            setSelectedEquipmentTags(prev => prev.filter(t => t !== tag));
                                        } else {
                                            setSelectedEquipmentTags(prev => [...prev, tag]);
                                        }
                                    }}
                                    className={`px-3 py-1 rounded-full text-sm transition-all ${
                                        isSelected
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                    }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                        {selectedEquipmentTags.length > 0 && (
                            <button
                                onClick={() => setSelectedEquipmentTags([])}
                                className="px-3 py-1 rounded-full text-sm bg-red-600/30 text-red-300 hover:bg-red-600/50 transition-all"
                            >
                                Clear Tags
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Exercise Grid */}
            {filteredExercises.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                        {searchTerm || filterCategory !== 'All' || selectedEquipmentTags.length > 0 
                            ? 'No exercises found' 
                            : exercises.length === 0 
                                ? 'No exercises yet' 
                                : 'No exercises match filters'}
                    </h3>
                    <p className="text-gray-400 mb-6">
                        {searchTerm || filterCategory !== 'All' || selectedEquipmentTags.length > 0 
                            ? `Try adjusting your filters. You have ${exercises.length} total exercise${exercises.length !== 1 ? 's' : ''} in the database.` 
                            : exercises.length === 0
                                ? 'Build your exercise library to get started'
                                : 'All exercises are being filtered out'}
                    </p>
                    {exercises.length === 0 ? (
                        <Button onClick={() => setIsFormOpen(true)}>Add Your First Exercise</Button>
                    ) : (
                        <div className="flex gap-3 justify-center">
                            <Button onClick={() => {
                                setSearchTerm('');
                                setFilterCategory('All');
                                setSelectedEquipmentTags([]);
                            }} variant="secondary">
                                Clear All Filters
                            </Button>
                            <Button onClick={() => setIsFormOpen(true)} variant="primary">
                                Add Exercise
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredExercises.map(exercise => (
                        <div key={exercise.id} className="glass glass-hover rounded-xl p-6 space-y-3 flex flex-col">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-white">{exercise.name}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-600/30 text-purple-300">
                                            {exercise.category}
                                        </span>
                                        {exercise.equipment && Array.isArray(exercise.equipment) && exercise.equipment.length > 0 && (
                                            exercise.equipment.map((equip, idx) => (
                                                <span key={idx} className="inline-block px-2 py-1 text-xs rounded-full bg-blue-600/30 text-blue-300">
                                                    {equip}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {exercise.description && (
                                <p className="text-sm text-gray-300 line-clamp-3 flex-1">{exercise.description}</p>
                            )}

                            {exercise.videoUrl && (
                                <a
                                    href={exercise.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Watch video
                                </a>
                            )}

                            <div className="flex gap-2 pt-2">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleEdit(exercise)}
                                    className="flex-1"
                                >
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleDelete(exercise.id)}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form Modal */}
            <ExerciseForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={editingExercise ? handleUpdate : handleAdd}
                initialData={editingExercise}
            />

            {/* Import Modal */}
            <Modal
                isOpen={isImportModalOpen}
                onClose={() => {
                    setIsImportModalOpen(false);
                    setPasteText('');
                    setJsonText('');
                    setImportMethod('file');
                }}
                title="Import Exercises"
                size="lg"
            >
                <div className="space-y-6">
                    {/* Method Selection */}
                    <div className="flex gap-2 border-b border-white/10 pb-4">
                        <button
                            onClick={() => setImportMethod('file')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                importMethod === 'file'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            File Upload
                        </button>
                        <button
                            onClick={() => setImportMethod('paste')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                importMethod === 'paste'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            Paste CSV/TSV
                        </button>
                        <button
                            onClick={() => setImportMethod('json')}
                            className={`px-4 py-2 rounded-lg transition-all ${
                                importMethod === 'json'
                                    ? 'bg-purple-600 text-white'
                                    : 'text-gray-300 hover:bg-white/10'
                            }`}
                        >
                            JSON
                        </button>
                    </div>

                    {/* File Upload Method */}
                    {importMethod === 'file' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400 mb-3">
                                    Upload an Excel (.xlsx, .xls), ODS (.ods), or CSV file with columns: <strong>Name, Category, Equipment, Video Demonstration</strong>
                                </p>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.ods"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                                <Button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={importing}
                                    loading={importing}
                                    className="w-full"
                                    icon={
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    }
                                >
                                    Choose File
                                </Button>
                            </div>
                            <div className="glass rounded-lg p-4 text-sm text-gray-300">
                                <p className="font-semibold mb-2">Example format:</p>
                                <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto">
{`Name,Category,Equipment,Video Demonstration
Barbell Squat,Strength,Barbell,https://youtube.com/...
Running,Cardio,Bodyweight,
Plank,Core,Bodyweight,https://youtube.com/...`}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* Paste CSV/TSV Method */}
                    {importMethod === 'paste' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Paste your CSV or TSV data (comma or tab separated)
                                </label>
                                <textarea
                                    value={pasteText}
                                    onChange={(e) => setPasteText(e.target.value)}
                                    placeholder="Name,Category,Equipment,Video Demonstration&#10;Barbell Squat,Strength,Barbell,https://youtube.com/...&#10;Running,Cardio,Bodyweight,"
                                    rows={10}
                                    className="w-full px-4 py-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 font-mono text-sm resize-none"
                                />
                            </div>
                            <Button
                                onClick={handlePasteImport}
                                disabled={importing || !pasteText.trim()}
                                loading={importing}
                                className="w-full"
                            >
                                Import from Text
                            </Button>
                            <div className="glass rounded-lg p-4 text-sm text-gray-300">
                                <p className="font-semibold mb-2">Format:</p>
                                <p className="text-xs">First row should be headers: <strong>Name, Category, Equipment, Video Demonstration</strong></p>
                                <p className="text-xs mt-1">Each subsequent row is an exercise. Equipment can be comma-separated. Empty cells are allowed.</p>
                            </div>
                        </div>
                    )}

                    {/* JSON Method */}
                    {importMethod === 'json' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Paste your JSON data
                                </label>
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => setJsonText(e.target.value)}
                                    placeholder='[{"name":"Barbell Squat","category":"Strength","videoUrl":"https://..."},...]'
                                    rows={10}
                                    className="w-full px-4 py-3 glass rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400 font-mono text-sm resize-none"
                                />
                            </div>
                            <Button
                                onClick={handleJSONImport}
                                disabled={importing || !jsonText.trim()}
                                loading={importing}
                                className="w-full"
                            >
                                Import from JSON
                            </Button>
                            <div className="glass rounded-lg p-4 text-sm text-gray-300">
                                <p className="font-semibold mb-2">JSON Format:</p>
                                <pre className="text-xs bg-black/30 p-3 rounded overflow-x-auto">
{`[
  {
    "name": "Barbell Squat",
    "category": "Strength",
    "videoUrl": "https://youtube.com/..."
  },
  {
    "name": "Running",
    "category": "Cardio"
  }
]`}
                                </pre>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
