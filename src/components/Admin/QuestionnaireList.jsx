import { useState, useEffect, useRef } from 'react';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import * as XLSX from 'xlsx';
import { 
    getAllClientQuestionnaires, 
    addClientQuestionnaire,
    updateClientQuestionnaire, 
    deleteClientQuestionnaire,
    isSupabaseConfigured 
} from '../../utils/supabase';

export const QuestionnaireList = () => {
    const [questionnaires, setQuestionnaires] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuestionnaire, setSelectedQuestionnaire] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [expandedIds, setExpandedIds] = useState(new Set());
    const fileInputRef = useRef(null);

    useEffect(() => {
        loadQuestionnaires();
    }, []);

    const loadQuestionnaires = async () => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await getAllClientQuestionnaires();
            setQuestionnaires(data || []);
        } catch (error) {
            console.error('Error loading questionnaires:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (questionnaire) => {
        // Convert database format to form format
        const formData = {
            firstName: questionnaire.first_name || '',
            lastName: questionnaire.last_name || '',
            dateOfBirth: questionnaire.date_of_birth || '',
            gender: questionnaire.gender || '',
            email: questionnaire.email || '',
            medicalConditions: questionnaire.medical_conditions || {},
            medicalDetails: questionnaire.medical_details || '',
            fitnessLevel: questionnaire.fitness_level?.toString() || '',
            currentActivities: questionnaire.current_activities || '',
            exerciseHistory: questionnaire.exercise_history || '',
            trainerExperience: questionnaire.trainer_experience || '',
            goals: questionnaire.goals || '',
            timeframe: questionnaire.timeframe || '',
            importance: questionnaire.importance?.toString() || '',
            agreement: questionnaire.agreement_accepted || false,
        };
        setSelectedQuestionnaire({ ...questionnaire, formData });
        setIsEditModalOpen(true);
    };

    const handleDelete = (id) => {
        setDeletingId(id);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deletingId) return;
        try {
            await deleteClientQuestionnaire(deletingId);
            await loadQuestionnaires();
            setIsDeleteModalOpen(false);
            setDeletingId(null);
        } catch (error) {
            console.error('Error deleting questionnaire:', error);
            alert('Failed to delete questionnaire. Please try again.');
        }
    };

    const handleExport = () => {
        try {
            const dataStr = JSON.stringify(questionnaires, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `questionnaires_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting questionnaires:', error);
            alert('Failed to export questionnaires.');
        }
    };

    const findColumnIndex = (headers, possibleNames) => {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => 
                h.toLowerCase().trim() === name.toLowerCase().trim() ||
                h.toLowerCase().trim().includes(name.toLowerCase().trim()) ||
                name.toLowerCase().trim().includes(h.toLowerCase().trim())
            );
            if (index !== -1) return index;
        }
        return -1;
    };

    // Convert Excel serial date to YYYY-MM-DD format
    const convertExcelDate = (excelDate) => {
        if (excelDate === null || excelDate === undefined || excelDate === '') return '';
        
        // If it's already a string in date format, return it
        if (typeof excelDate === 'string') {
            const trimmed = excelDate.trim();
            if (!trimmed) return '';
            
            // Check if it's already in YYYY-MM-DD format
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
                return trimmed;
            }
            // Try to parse as date string
            const parsed = new Date(trimmed);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1900 && parsed.getFullYear() < 2100) {
                return parsed.toISOString().split('T')[0];
            }
            return '';
        }
        
        // If it's a number, treat it as Excel serial date
        if (typeof excelDate === 'number') {
            // Validate the number is reasonable (Excel dates are typically between 1 and ~100000)
            if (isNaN(excelDate) || excelDate < 1 || excelDate > 1000000) {
                return '';
            }
            
            // Excel epoch: January 1, 1900 = 1
            // JavaScript Date epoch: January 1, 1970
            // Excel date 1 = December 30, 1899 in JavaScript
            const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
            const jsDate = new Date(excelEpoch.getTime() + (excelDate - 1) * 86400 * 1000);
            
            // Check if date is valid and reasonable
            if (isNaN(jsDate.getTime())) {
                return '';
            }
            
            const year = jsDate.getFullYear();
            // Validate year is reasonable
            if (year < 1900 || year > 2100) {
                return '';
            }
            
            // Format as YYYY-MM-DD
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
        
        return '';
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
                        reject(new Error('File must have at least a header row and one data row'));
                        return;
                    }
                    
                    // First row is headers
                    const headers = jsonData[0].map(h => String(h || '').trim());
                    
                    // Find column indices - flexible matching (try many variations)
                    const firstNameIndex = findColumnIndex(headers, [
                        'first name', 'firstname', 'fname', 'given name', 'name', 'first',
                        'voornaam', 'förnamn', 'prénom', 'vorname', // Common in other languages
                        'first_name', 'first-name', 'firstname', 'first name'
                    ]);
                    const lastNameIndex = findColumnIndex(headers, [
                        'last name', 'lastname', 'lname', 'surname', 'family name', 'last',
                        'achternaam', 'efternamn', 'nom', 'nachname', // Common in other languages
                        'last_name', 'last-name', 'lastname', 'last name', 'surname'
                    ]);
                    const emailIndex = findColumnIndex(headers, ['email', 'e-mail', 'email address', 'e_mail', 'email_address']);
                    const dobIndex = findColumnIndex(headers, ['date of birth', 'dob', 'birthdate', 'birth date', 'date_of_birth']);
                    const genderIndex = findColumnIndex(headers, ['gender', 'sex']);
                    const fitnessLevelIndex = findColumnIndex(headers, ['fitness level', 'fitness_level', 'fitness', 'activity level']);
                    const goalsIndex = findColumnIndex(headers, ['goals', 'fitness goals', 'goal', 'objectives']);
                    const timeframeIndex = findColumnIndex(headers, ['timeframe', 'time frame', 'goal timeframe']);
                    const importanceIndex = findColumnIndex(headers, ['importance', 'goal importance', 'priority']);
                    const currentActivitiesIndex = findColumnIndex(headers, ['current activities', 'activities', 'current physical activities']);
                    const exerciseHistoryIndex = findColumnIndex(headers, ['exercise history', 'history', 'previous exercise']);
                    const trainerExperienceIndex = findColumnIndex(headers, ['trainer experience', 'previous trainer', 'pt experience']);
                    const medicalDetailsIndex = findColumnIndex(headers, ['medical details', 'medical information', 'additional medical', 'medical notes']);
                    
                    // Medical condition columns
                    const medicalConditionIndices = {};
                    const conditionKeys = {
                        'heart condition': 'heartCondition',
                        'chest discomfort': 'chestDiscomfort',
                        'asthma': 'asthma',
                        'diabetes': 'diabetic',
                        'diabetic': 'diabetic',
                        'dizziness': 'dizziness',
                        'fainting': 'dizziness',
                        'pregnant': 'pregnant',
                        'pregnancy': 'pregnant',
                        'epilepsy': 'epilepsy',
                        'medication': 'medication',
                        'prescribed medication': 'medication',
                        'smoke': 'smoke',
                        'smoking': 'smoke',
                        'injury': 'injury',
                        'pain': 'injury',
                    };
                    
                    Object.entries(conditionKeys).forEach(([headerName, key]) => {
                        const idx = findColumnIndex(headers, [headerName]);
                        if (idx !== -1) {
                            medicalConditionIndices[key] = idx;
                        }
                    });
                    
                    // Parse rows (skip header)
                    const questionnaires = [];
                    
                    // Debug: Log what we found
                    console.log('Column mapping results:', {
                        allHeaders: headers,
                        firstNameIndex,
                        lastNameIndex,
                        emailIndex,
                        firstNameHeader: firstNameIndex !== -1 ? headers[firstNameIndex] : 'NOT FOUND',
                        lastNameHeader: lastNameIndex !== -1 ? headers[lastNameIndex] : 'NOT FOUND',
                        emailHeader: emailIndex !== -1 ? headers[emailIndex] : 'NOT FOUND',
                    });
                    
                    for (let i = 1; i < jsonData.length; i++) {
                        const row = jsonData[i];
                        
                        // Get basic info
                        let firstName = firstNameIndex !== -1 ? String(row[firstNameIndex] || '').trim() : '';
                        let lastName = lastNameIndex !== -1 ? String(row[lastNameIndex] || '').trim() : '';
                        const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim() : '';
                        
                        // Try to split "Full Name" if first/last name columns not found
                        if (!firstName && !lastName) {
                            const nameIndex = findColumnIndex(headers, ['name', 'full name', 'client name', 'fullname', 'full_name', 'client_name']);
                            if (nameIndex !== -1) {
                                const fullName = String(row[nameIndex] || '').trim();
                                if (fullName) {
                                    const nameParts = fullName.split(/\s+/).filter(p => p.trim());
                                    if (nameParts.length > 0) {
                                        firstName = nameParts[0];
                                        lastName = nameParts.slice(1).join(' ') || '';
                                    }
                                }
                            }
                        }
                        
                        // Skip if no name (both first and last are required by DB)
                        if (!firstName && !lastName) {
                            console.log(`Skipping row ${i + 1}: No name found. Row data:`, row);
                            continue;
                        }
                        
                        // Build medical conditions object
                        const medicalConditions = {};
                        Object.entries(medicalConditionIndices).forEach(([key, idx]) => {
                            const value = row[idx];
                            // Check for yes/true/1 or checkbox-like values
                            if (value !== undefined && value !== null && value !== '') {
                                const strValue = String(value).toLowerCase().trim();
                                medicalConditions[key] = ['yes', 'true', '1', 'y', 'checked', 'x'].includes(strValue);
                            }
                        });
                        
                        // Ensure we have valid names (required by DB)
                        // If one is missing, use the other or a single character
                        const finalFirstName = firstName.trim() || (lastName.trim() ? lastName.trim().split(' ')[0] : 'N');
                        const finalLastName = lastName.trim() || (firstName.trim() ? firstName.trim().split(' ').slice(-1)[0] : 'N');
                        
                        // Log if we're using fallback values
                        if (!firstName || !lastName) {
                            console.warn(`Row ${i + 1}: Using fallback names. Original: firstName="${firstName}", lastName="${lastName}". Using: "${finalFirstName}" "${finalLastName}"`);
                        }
                        
                        // Build questionnaire data
                        let dateOfBirth = '';
                        if (dobIndex !== -1 && row[dobIndex] !== undefined && row[dobIndex] !== null && row[dobIndex] !== '') {
                            dateOfBirth = convertExcelDate(row[dobIndex]);
                        }
                        
                        // Generate email if missing
                        const finalEmail = email.trim() || `${finalFirstName.toLowerCase()}${finalLastName.toLowerCase()}@imported.local`.replace(/\s+/g, '');
                        
                        const questionnaireData = {
                            firstName: finalFirstName,
                            lastName: finalLastName,
                            email: finalEmail,
                            dateOfBirth: dateOfBirth,
                            gender: genderIndex !== -1 ? String(row[genderIndex] || '').trim() : '',
                            medicalConditions: medicalConditions,
                            medicalDetails: medicalDetailsIndex !== -1 ? String(row[medicalDetailsIndex] || '').trim() : '',
                            fitnessLevel: fitnessLevelIndex !== -1 ? String(row[fitnessLevelIndex] || '').trim() : '',
                            currentActivities: currentActivitiesIndex !== -1 ? String(row[currentActivitiesIndex] || '').trim() : '',
                            exerciseHistory: exerciseHistoryIndex !== -1 ? String(row[exerciseHistoryIndex] || '').trim() : '',
                            trainerExperience: trainerExperienceIndex !== -1 ? String(row[trainerExperienceIndex] || '').trim() : '',
                            goals: goalsIndex !== -1 ? String(row[goalsIndex] || '').trim() : '',
                            timeframe: timeframeIndex !== -1 ? String(row[timeframeIndex] || '').trim() : '',
                            importance: importanceIndex !== -1 ? String(row[importanceIndex] || '').trim() : '',
                            agreement: true, // Assume agreed if importing
                        };
                        
                        questionnaires.push(questionnaireData);
                    }
                    
                    if (questionnaires.length === 0) {
                        reject(new Error('No valid questionnaires found in the file'));
                        return;
                    }
                    
                    resolve(questionnaires);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsArrayBuffer(file);
        });
    };

    const handleImport = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setImporting(true);
            
            let questionnairesToImport = [];
            
            // Check file type
            const fileName = file.name.toLowerCase();
            if (fileName.endsWith('.json')) {
                // JSON import
                const text = await file.text();
                const data = JSON.parse(text);
                questionnairesToImport = Array.isArray(data) ? data : [data];
                
                // Convert to form format
                questionnairesToImport = questionnairesToImport.map(q => ({
                    firstName: q.first_name || q.firstName || '',
                    lastName: q.last_name || q.lastName || '',
                    email: q.email || '',
                    dateOfBirth: q.date_of_birth || q.dateOfBirth || '',
                    gender: q.gender || '',
                    medicalConditions: q.medical_conditions || q.medicalConditions || {},
                    medicalDetails: q.medical_details || q.medicalDetails || '',
                    fitnessLevel: q.fitness_level || q.fitnessLevel || '',
                    currentActivities: q.current_activities || q.currentActivities || '',
                    exerciseHistory: q.exercise_history || q.exerciseHistory || '',
                    trainerExperience: q.trainer_experience || q.trainerExperience || '',
                    goals: q.goals || '',
                    timeframe: q.timeframe || '',
                    importance: q.importance || '',
                    agreement: q.agreement_accepted || q.agreement || false,
                }));
            } else if (fileName.endsWith('.ods') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Excel/ODS import
                questionnairesToImport = await parseExcelFile(file);
            } else {
                throw new Error('Unsupported file format. Please use .json, .ods, .xlsx, or .xls');
            }

            let imported = 0;
            let errors = 0;
            const errorMessages = [];

            for (let i = 0; i < questionnairesToImport.length; i++) {
                const formData = questionnairesToImport[i];
                try {
                    // Validate required fields
                    if (!formData.email && !formData.firstName && !formData.lastName) {
                        throw new Error(`Row ${i + 1}: Missing required fields (email, first name, or last name)`);
                    }
                    
                    // Ensure email is present (required by database)
                    if (!formData.email) {
                        // Try to create a placeholder email if name exists
                        if (formData.firstName || formData.lastName) {
                            formData.email = `${(formData.firstName || '').toLowerCase()}${(formData.lastName || '').toLowerCase()}@imported.local`.replace(/\s+/g, '');
                        } else {
                            throw new Error(`Row ${i + 1}: Email is required`);
                        }
                    }
                    
                    await addClientQuestionnaire(formData);
                    imported++;
                } catch (error) {
                    console.error(`Error importing questionnaire row ${i + 1}:`, error);
                    const errorMsg = error.message || error.toString();
                    errorMessages.push(`Row ${i + 1}: ${errorMsg}`);
                    errors++;
                }
            }

            await loadQuestionnaires();
            
            let message = `Import complete: ${imported} imported, ${errors} errors`;
            if (errors > 0 && errorMessages.length > 0) {
                message += `\n\nFirst few errors:\n${errorMessages.slice(0, 5).join('\n')}`;
                if (errorMessages.length > 5) {
                    message += `\n... and ${errorMessages.length - 5} more errors`;
                }
            }
            alert(message);
        } catch (error) {
            console.error('Error importing questionnaires:', error);
            alert(`Failed to import questionnaires: ${error.message}`);
        } finally {
            setImporting(false);
            e.target.value = '';
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch {
            return dateStr;
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const getMedicalConditionsList = (conditions) => {
        if (!conditions || typeof conditions !== 'object') return [];
        const conditionLabels = {
            heartCondition: 'Heart Condition',
            chestDiscomfort: 'Chest Discomfort',
            asthma: 'Asthma',
            diabetic: 'Diabetes',
            dizziness: 'Dizziness/Fainting',
            pregnant: 'Pregnant',
            epilepsy: 'Epilepsy',
            medication: 'Prescribed Medication',
            smoke: 'Do you smoke?',
            injury: 'Injury or Pain',
        };
        return Object.entries(conditions)
            .filter(([key, value]) => value === true)
            .map(([key]) => conditionLabels[key] || key);
    };

    const filteredQuestionnaires = questionnaires.filter(q => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (q.first_name?.toLowerCase().includes(searchLower)) ||
            (q.last_name?.toLowerCase().includes(searchLower)) ||
            (q.email?.toLowerCase().includes(searchLower))
        );
    });

    if (!isSupabaseConfigured) {
        return (
            <div className="glass rounded-2xl p-8 border border-white/10 text-center">
                <p className="text-gray-400">Supabase is not configured. Please set up your environment variables.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="glass rounded-2xl p-8 border border-white/10 text-center">
                <p className="text-gray-400">Loading questionnaires...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="glass rounded-2xl p-6 border border-white/10">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Form Submissions</h2>
                        <p className="text-gray-400 mt-1">{questionnaires.length} total submission{questionnaires.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                        />
                        <Button
                            onClick={handleExport}
                            variant="secondary"
                            disabled={questionnaires.length === 0 || exporting}
                        >
                            {exporting ? 'Exporting...' : 'Export'}
                        </Button>
                        <label>
                            <input
                                type="file"
                                accept=".json,.ods,.xlsx,.xls"
                                onChange={handleImport}
                                className="hidden"
                                ref={fileInputRef}
                            />
                            <Button
                                variant="secondary"
                                disabled={importing}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {importing ? 'Importing...' : 'Import from File'}
                            </Button>
                        </label>
                    </div>
                </div>
            </div>

            {/* Questionnaires List */}
            {filteredQuestionnaires.length === 0 ? (
                <div className="glass rounded-2xl p-12 border border-white/10 text-center">
                    <p className="text-gray-400 text-lg">
                        {searchTerm ? 'No questionnaires found matching your search.' : 'No questionnaires submitted yet.'}
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredQuestionnaires.map((q) => {
                        const isExpanded = expandedIds.has(q.id);
                        const medicalConditions = getMedicalConditionsList(q.medical_conditions);
                        
                        return (
                            <div key={q.id} className="glass rounded-2xl border border-white/10 overflow-hidden">
                                <div className="p-6">
                                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-white">
                                                    {q.first_name} {q.last_name}
                                                </h3>
                                                <button
                                                    onClick={() => toggleExpand(q.id)}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                    aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
                                                >
                                                    <svg 
                                                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                        fill="none" 
                                                        stroke="currentColor" 
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-300">
                                                <p><span className="font-medium">Email:</span> {q.email}</p>
                                                <p><span className="font-medium">Date of Birth:</span> {formatDate(q.date_of_birth)}</p>
                                                <p><span className="font-medium">Gender:</span> {q.gender || 'N/A'}</p>
                                                <p><span className="font-medium">Fitness Level:</span> {q.fitness_level || 'N/A'}/10</p>
                                                <p><span className="font-medium">Submitted:</span> {formatDate(q.submitted_at)}</p>
                                                {medicalConditions.length > 0 && (
                                                    <p><span className="font-medium">Medical Conditions:</span> {medicalConditions.length} selected</p>
                                                )}
                                            </div>
                                            {q.goals && (
                                                <p className="mt-3 text-sm text-gray-400 line-clamp-2">
                                                    <span className="font-medium">Goals:</span> {q.goals}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => handleEdit(q)}
                                                variant="secondary"
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                onClick={() => handleDelete(q.id)}
                                                variant="danger"
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="mt-6 pt-6 border-t border-white/10 space-y-4">
                                            {/* Medical Conditions */}
                                            {medicalConditions.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Medical Conditions:</h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {medicalConditions.map((condition, idx) => (
                                                            <span key={idx} className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-sm text-red-200">
                                                                {condition}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {q.medical_details && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Additional Medical Information:</h4>
                                                    <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">{q.medical_details}</p>
                                                </div>
                                            )}

                                            {/* Fitness Information */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {q.current_activities && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white mb-2">Current Activities:</h4>
                                                        <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">{q.current_activities}</p>
                                                    </div>
                                                )}
                                                {q.exercise_history && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white mb-2">Exercise History:</h4>
                                                        <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">{q.exercise_history}</p>
                                                    </div>
                                                )}
                                                {q.trainer_experience && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white mb-2">Previous Trainer Experience:</h4>
                                                        <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">{q.trainer_experience}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Goals */}
                                            {q.goals && (
                                                <div>
                                                    <h4 className="text-sm font-semibold text-white mb-2">Fitness Goals:</h4>
                                                    <p className="text-sm text-gray-300 bg-white/5 p-3 rounded-lg">{q.goals}</p>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {q.timeframe && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white mb-2">Goal Timeframe:</h4>
                                                        <p className="text-sm text-gray-300">{q.timeframe}</p>
                                                    </div>
                                                )}
                                                {q.importance && (
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-white mb-2">Goal Importance:</h4>
                                                        <p className="text-sm text-gray-300">{q.importance}/10</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedQuestionnaire(null);
                }}
                title="Edit Questionnaire"
                size="xl"
            >
                {selectedQuestionnaire && (
                    <QuestionnaireEditForm
                        questionnaire={selectedQuestionnaire}
                        onSave={async (formData) => {
                            try {
                                await updateClientQuestionnaire(selectedQuestionnaire.id, formData);
                                await loadQuestionnaires();
                                setIsEditModalOpen(false);
                                setSelectedQuestionnaire(null);
                            } catch (error) {
                                console.error('Error updating questionnaire:', error);
                                alert('Failed to update questionnaire. Please try again.');
                            }
                        }}
                        onCancel={() => {
                            setIsEditModalOpen(false);
                            setSelectedQuestionnaire(null);
                        }}
                    />
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDeletingId(null);
                }}
                title="Delete Questionnaire"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-300">Are you sure you want to delete this questionnaire? This action cannot be undone.</p>
                    <div className="flex gap-3 justify-end">
                        <Button
                            onClick={() => {
                                setIsDeleteModalOpen(false);
                                setDeletingId(null);
                            }}
                            variant="secondary"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmDelete}
                            variant="danger"
                        >
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// Edit Form Component
const QuestionnaireEditForm = ({ questionnaire, onSave, onCancel }) => {
    const [formData, setFormData] = useState(questionnaire.formData || {
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        email: '',
        medicalConditions: {},
        medicalDetails: '',
        fitnessLevel: '',
        currentActivities: '',
        exerciseHistory: '',
        trainerExperience: '',
        goals: '',
        timeframe: '',
        importance: '',
        agreement: false,
    });
    const [saving, setSaving] = useState(false);

    const handleInputChange = (field, value) => {
        if (field.startsWith('medicalConditions.')) {
            const condition = field.split('.')[1];
            setFormData(prev => ({
                ...prev,
                medicalConditions: {
                    ...prev.medicalConditions,
                    [condition]: value,
                },
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await onSave(formData);
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Personal Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">First name *</label>
                        <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Last name *</label>
                        <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Date of Birth</label>
                        <input
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Gender</label>
                        <select
                            value={formData.gender}
                            onChange={(e) => handleInputChange('gender', e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        >
                            <option value="">Select gender</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">Prefer not to say</option>
                        </select>
                    </div>
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Email *</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                        />
                    </div>
                </div>
            </div>

            {/* Medical Conditions */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Medical Conditions</h3>
                <div className="grid grid-cols-2 gap-3">
                    {Object.entries({
                        heartCondition: 'Heart Condition',
                        chestDiscomfort: 'Chest Discomfort',
                        asthma: 'Asthma',
                        diabetic: 'Diabetes',
                        dizziness: 'Dizziness/Fainting',
                        pregnant: 'Pregnant',
                        epilepsy: 'Epilepsy',
                        medication: 'Prescribed Medication',
                        smoke: 'Do you smoke?',
                        injury: 'Injury or Pain',
                    }).map(([key, label]) => (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                id={`edit-${key}`}
                                checked={formData.medicalConditions[key] || false}
                                onChange={(e) => handleInputChange(`medicalConditions.${key}`, e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                            />
                            <label htmlFor={`edit-${key}`} className="ml-2 text-sm text-gray-300">{label}</label>
                        </div>
                    ))}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Additional Medical Information</label>
                    <textarea
                        rows="3"
                        value={formData.medicalDetails}
                        onChange={(e) => handleInputChange('medicalDetails', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
            </div>

            {/* Fitness Information */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Fitness Information</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Fitness Level (1-10)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.fitnessLevel}
                        onChange={(e) => handleInputChange('fitnessLevel', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Current Activities</label>
                    <textarea
                        rows="2"
                        value={formData.currentActivities}
                        onChange={(e) => handleInputChange('currentActivities', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Exercise History</label>
                    <textarea
                        rows="2"
                        value={formData.exerciseHistory}
                        onChange={(e) => handleInputChange('exerciseHistory', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Trainer Experience</label>
                    <textarea
                        rows="2"
                        value={formData.trainerExperience}
                        onChange={(e) => handleInputChange('trainerExperience', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
            </div>

            {/* Goals */}
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Fitness Goals</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Goals</label>
                    <textarea
                        rows="3"
                        value={formData.goals}
                        onChange={(e) => handleInputChange('goals', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Timeframe</label>
                    <input
                        type="text"
                        value={formData.timeframe}
                        onChange={(e) => handleInputChange('timeframe', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Importance (1-10)</label>
                    <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.importance}
                        onChange={(e) => handleInputChange('importance', e.target.value)}
                        className="w-full px-4 py-2 glass rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
                <Button
                    type="button"
                    onClick={onCancel}
                    variant="secondary"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    variant="primary"
                    disabled={saving}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </Button>
            </div>
        </form>
    );
};
