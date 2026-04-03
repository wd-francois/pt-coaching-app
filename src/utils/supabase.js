import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase environment variables are missing.');
  console.warn('The app will use IndexedDB instead. To use Supabase:');
  console.warn('1. Create a .env file in the project root');
  console.warn('2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.warn('3. See SUPABASE_SETUP.md for detailed instructions');
}

// Create Supabase client (will be null if not configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'public',
      },
    })
  : null;

// Helper function to generate UUID (for client-side ID generation if needed)
export const generateId = () => {
  return crypto.randomUUID();
};

// Client Questionnaire operations
export const addClientQuestionnaire = async (questionnaireData) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    // Validate required fields
    if (!questionnaireData.email) {
      throw new Error('Email is required');
    }
    
    // Helper function to validate and format date
    const formatDateForDB = (dateValue) => {
      if (!dateValue) return null;
      
      const dateStr = String(dateValue).trim();
      if (!dateStr) return null;
      
      // Check if it's already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      
      // Try to parse as date
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      
      // If it's a number, it might be an Excel serial date
      const numValue = Number(dateStr);
      if (!isNaN(numValue) && numValue > 0 && numValue < 1000000) {
        // Excel serial date conversion
        // Excel epoch: January 1, 1900 = 1
        // JavaScript Date epoch: January 1, 1970
        // Excel date 1 = December 30, 1899 in JavaScript
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + (numValue - 1) * 86400 * 1000);
        if (!isNaN(jsDate.getTime())) {
          const year = jsDate.getFullYear();
          // Validate year is reasonable
          if (year >= 1900 && year <= 2100) {
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
        }
      }
      
      return null;
    };
    
    // Validate required fields
    const firstName = (questionnaireData.firstName || '').trim();
    const lastName = (questionnaireData.lastName || '').trim();
    
    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }
    
    // Map camelCase to snake_case for database
    const dbData = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: formatDateForDB(questionnaireData.dateOfBirth),
      gender: questionnaireData.gender ? String(questionnaireData.gender).trim() : null,
      email: String(questionnaireData.email).trim(),
      medical_conditions: questionnaireData.medicalConditions || {},
      medical_details: questionnaireData.medicalDetails ? String(questionnaireData.medicalDetails).trim() : null,
      fitness_level: questionnaireData.fitnessLevel ? (parseInt(String(questionnaireData.fitnessLevel)) || null) : null,
      current_activities: questionnaireData.currentActivities ? String(questionnaireData.currentActivities).trim() : null,
      exercise_history: questionnaireData.exerciseHistory ? String(questionnaireData.exerciseHistory).trim() : null,
      trainer_experience: questionnaireData.trainerExperience ? String(questionnaireData.trainerExperience).trim() : null,
      goals: questionnaireData.goals ? String(questionnaireData.goals).trim() : null,
      timeframe: questionnaireData.timeframe ? String(questionnaireData.timeframe).trim() : null,
      importance: questionnaireData.importance ? (parseInt(String(questionnaireData.importance)) || null) : null,
      agreement_accepted: questionnaireData.agreement !== undefined ? Boolean(questionnaireData.agreement) : false,
      submitted_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('client_questionnaires')
      .insert([dbData])
      .select()
      .single();

    if (error) throw error;
    console.log('Questionnaire saved to Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('Error adding client questionnaire:', error);
    throw error;
  }
};

export const getAllClientQuestionnaires = async () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { data, error } = await supabase
      .from('client_questionnaires')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (error) throw error;
    console.log(`Retrieved ${data?.length || 0} questionnaires from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Error getting all client questionnaires:', error);
    return [];
  }
};

export const getClientQuestionnaire = async (id) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { data, error } = await supabase
      .from('client_questionnaires')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting client questionnaire:', error);
    return null;
  }
};

export const updateClientQuestionnaire = async (id, questionnaireData) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const dbData = {
      first_name: questionnaireData.firstName,
      last_name: questionnaireData.lastName,
      date_of_birth: questionnaireData.dateOfBirth || null,
      gender: questionnaireData.gender || null,
      email: questionnaireData.email,
      medical_conditions: questionnaireData.medicalConditions || {},
      medical_details: questionnaireData.medicalDetails || null,
      fitness_level: questionnaireData.fitnessLevel ? parseInt(questionnaireData.fitnessLevel) : null,
      current_activities: questionnaireData.currentActivities || null,
      exercise_history: questionnaireData.exerciseHistory || null,
      trainer_experience: questionnaireData.trainerExperience || null,
      goals: questionnaireData.goals || null,
      timeframe: questionnaireData.timeframe || null,
      importance: questionnaireData.importance ? parseInt(questionnaireData.importance) : null,
      agreement_accepted: questionnaireData.agreement || false,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('client_questionnaires')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    console.log('Questionnaire updated in Supabase:', data.id);
    return data;
  } catch (error) {
    console.error('Error updating client questionnaire:', error);
    throw error;
  }
};

export const deleteClientQuestionnaire = async (id) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { error } = await supabase
      .from('client_questionnaires')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('Questionnaire deleted from Supabase:', id);
  } catch (error) {
    console.error('Error deleting client questionnaire:', error);
    throw error;
  }
};

// Client operations
export const addClient = async (client) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured. Please set up your .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  }
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        ...client,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    console.log('Client saved to Supabase:', data.name);
    return data;
  } catch (error) {
    console.error('Error adding client:', error);
    throw error;
  }
};

export const updateClient = async (id, updates) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (id) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

export const getClient = async (id) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error getting client:', error);
    return null;
  }
};

export const getAllClients = async () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    console.log(`Retrieved ${data?.length || 0} clients from Supabase`);
    return data || [];
  } catch (error) {
    console.error('Error getting all clients:', error);
    return [];
  }
};

export const addClientsBatch = async (clients) => {
  try {
    const clientsWithTimestamps = clients.map(client => ({
      ...client,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('clients')
      .insert(clientsWithTimestamps)
      .select();

    if (error) throw error;
    console.log(`Saved ${data?.length || 0} clients to Supabase`);
    return data || [];
  } catch (error) {
    console.error('Error adding clients batch:', error);
    throw error;
  }
};

// Helper function to convert exercise from DB format to app format
const mapExerciseFromDB = (exercise) => {
  if (!exercise) return null;
  return {
    ...exercise,
    description: exercise.instructions || exercise.description || '',
    equipment: exercise.equipment_tags || exercise.equipment || [],
    videoUrl: exercise.video_url || exercise.videoUrl || '',
  };
};

// Helper function to convert exercise from app format to DB format
const mapExerciseToDB = (exercise) => {
  return {
    name: exercise.name,
    category: exercise.category || null,
    instructions: exercise.description || exercise.instructions || null,
    equipment_tags: Array.isArray(exercise.equipment) ? exercise.equipment : (exercise.equipment ? [exercise.equipment] : []),
    muscle_groups: Array.isArray(exercise.muscle_groups) ? exercise.muscle_groups : (exercise.muscle_groups ? [exercise.muscle_groups] : []),
    video_url: exercise.videoUrl || exercise.video_url || null,
  };
};

// Exercise operations
export const addExercise = async (exercise) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const dbExercise = mapExerciseToDB(exercise);
    const { data, error } = await supabase
      .from('exercises')
      .insert([{
        ...dbExercise,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    const parsedData = mapExerciseFromDB(data);
    console.log('Exercise saved to Supabase:', parsedData.name);
    return parsedData;
  } catch (error) {
    console.error('Error adding exercise:', error);
    throw error;
  }
};

export const updateExercise = async (id, updates) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case and handle description -> instructions
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.description !== undefined) updateData.instructions = updates.description;
    if (updates.instructions !== undefined) updateData.instructions = updates.instructions;
    if (updates.equipment !== undefined) {
      updateData.equipment_tags = Array.isArray(updates.equipment) ? updates.equipment : (updates.equipment ? [updates.equipment] : []);
    }
    if (updates.equipment_tags !== undefined) {
      updateData.equipment_tags = Array.isArray(updates.equipment_tags) ? updates.equipment_tags : (updates.equipment_tags ? [updates.equipment_tags] : []);
    }
    if (updates.muscle_groups !== undefined) {
      updateData.muscle_groups = Array.isArray(updates.muscle_groups) ? updates.muscle_groups : (updates.muscle_groups ? [updates.muscle_groups] : []);
    }
    if (updates.videoUrl !== undefined) updateData.video_url = updates.videoUrl;
    if (updates.video_url !== undefined) updateData.video_url = updates.video_url;

    const { data, error } = await supabase
      .from('exercises')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapExerciseFromDB(data);
  } catch (error) {
    console.error('Error updating exercise:', error);
    throw error;
  }
};

export const deleteExercise = async (id) => {
  try {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting exercise:', error);
    throw error;
  }
};

export const getExercise = async (id) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapExerciseFromDB(data);
  } catch (error) {
    console.error('Error getting exercise:', error);
    return null;
  }
};

export const getAllExercises = async () => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    const parsedData = (data || []).map(mapExerciseFromDB);
    console.log(`Retrieved ${parsedData.length} exercises from Supabase`);
    return parsedData;
  } catch (error) {
    console.error('Error getting all exercises:', error);
    return [];
  }
};

export const addExercisesBatch = async (exercises) => {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured');
  }
  try {
    const exercisesWithTimestamps = exercises.map(exercise => {
      const dbExercise = mapExerciseToDB(exercise);
      return {
        ...dbExercise,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from('exercises')
      .insert(exercisesWithTimestamps)
      .select();

    if (error) throw error;
    const parsedData = (data || []).map(mapExerciseFromDB);
    console.log(`Saved ${parsedData.length} exercises to Supabase`);
    return parsedData;
  } catch (error) {
    console.error('Error adding exercises batch:', error);
    throw error;
  }
};

// Helper function to convert workout from DB format to app format
const mapWorkoutFromDB = (workout) => {
  if (!workout) return null;
  return {
    ...workout,
    clientId: workout.client_id,
    groupSessionId: workout.group_session_id,
    isGroup: workout.is_group,
    exercises: typeof workout.exercises === 'string' ? JSON.parse(workout.exercises) : workout.exercises,
    name: workout.name || null, // Workout name field
    notes: workout.notes || null, // Session notes
  };
};

// Helper function to convert workout from app format to DB format
const mapWorkoutToDB = (workout, includeName = true) => {
  const dbWorkout = {
    client_id: workout.clientId,
    date: workout.date,
    time: workout.time || '',
    exercises: JSON.stringify(workout.exercises || []),
    is_group: workout.isGroup || false,
    group_session_id: workout.groupSessionId || null,
    notes: workout.notes || null,
  };
  // Only include name if explicitly requested (and column exists in DB)
  if (includeName && workout.name !== undefined) {
    dbWorkout.name = workout.name || null;
  }
  return dbWorkout;
};

// Workout operations
export const addWorkout = async (workout) => {
  try {
    // Try with name field first
    let dbWorkout = mapWorkoutToDB(workout, true);
    let { data, error } = await supabase
      .from('workouts')
      .insert([{
        ...dbWorkout,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    // If error is about missing 'name' column, retry without it
    if (error && error.message && error.message.includes("'name' column")) {
      console.warn('Name column not found in workouts table. Retrying without name field. Please run migration 004_add_name_to_workouts.sql');
      dbWorkout = mapWorkoutToDB(workout, false);
      const retryResult = await supabase
        .from('workouts')
        .insert([{
          ...dbWorkout,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) throw error;
    const parsedData = mapWorkoutFromDB(data);
    console.log('Workout saved for client:', workout.clientId);
    return parsedData;
  } catch (error) {
    console.error('Error adding workout:', error);
    throw error;
  }
};

export const updateWorkout = async (id, updates) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    if (updates.clientId !== undefined) updateData.client_id = updates.clientId;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.time !== undefined) updateData.time = updates.time;
    if (updates.isGroup !== undefined) updateData.is_group = updates.isGroup;
    if (updates.groupSessionId !== undefined) updateData.group_session_id = updates.groupSessionId;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    // Conditionally include name field
    if (updates.name !== undefined) updateData.name = updates.name;
    
    // If exercises are being updated, stringify them
    if (updates.exercises) {
      updateData.exercises = JSON.stringify(updates.exercises);
    }

    let { data, error } = await supabase
      .from('workouts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    // If error is about missing 'name' column, retry without it
    if (error && error.message && error.message.includes("'name' column")) {
      console.warn('Name column not found in workouts table. Retrying without name field. Please run migration 004_add_name_to_workouts.sql');
      delete updateData.name;
      const retryResult = await supabase
        .from('workouts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error) throw error;
    return mapWorkoutFromDB(data);
  } catch (error) {
    console.error('Error updating workout:', error);
    throw error;
  }
};

export const deleteWorkout = async (id) => {
  try {
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting workout:', error);
    throw error;
  }
};

export const getWorkout = async (id) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapWorkoutFromDB(data);
  } catch (error) {
    console.error('Error getting workout:', error);
    return null;
  }
};

export const getAllWorkouts = async () => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    
    const parsedData = (data || []).map(mapWorkoutFromDB);
    console.log(`Retrieved ${parsedData.length} workouts from Supabase`);
    return parsedData;
  } catch (error) {
    console.error('Error getting all workouts:', error);
    return [];
  }
};

export const getWorkoutsByDate = async (date) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('date', date);

    if (error) throw error;
    return (data || []).map(mapWorkoutFromDB);
  } catch (error) {
    console.error('Error getting workouts by date:', error);
    return [];
  }
};

export const getWorkoutsByClient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapWorkoutFromDB);
  } catch (error) {
    console.error('Error getting workouts by client:', error);
    return [];
  }
};

const SKINFOLD_SITES = ['chest', 'abdominal', 'thigh', 'tricep', 'subscapular', 'suprailiac'];
const SKINFOLD_LEGACY_COL = {
  chest: 'chest_skinfold',
  abdominal: 'abdominal_skinfold',
  thigh: 'thigh_skinfold',
  tricep: 'tricep_skinfold',
  subscapular: 'subscapular_skinfold',
  suprailiac: 'suprailiac_skinfold',
};
const SKINFOLD_LEGACY_CAMEL = {
  chest: 'chestSkinfold',
  abdominal: 'abdominalSkinfold',
  thigh: 'thighSkinfold',
  tricep: 'tricepSkinfold',
  subscapular: 'subscapularSkinfold',
  suprailiac: 'suprailiacSkinfold',
};

const averageSkinfoldTriple = (arr) => {
  if (!Array.isArray(arr)) return null;
  const nums = arr.filter((v) => v != null && v !== '' && !Number.isNaN(Number(v))).map(Number);
  if (nums.length === 0) return null;
  const sum = nums.reduce((a, b) => a + b, 0);
  return Math.round((sum / nums.length) * 10) / 10;
};

const parseSkinfoldReadingsFromRow = (row) => {
  const json = row.skinfold_readings;
  const out = {};
  for (const site of SKINFOLD_SITES) {
    let a = null;
    let b = null;
    let c = null;
    if (json && typeof json === 'object' && Array.isArray(json[site])) {
      const t = json[site];
      a = t[0] != null ? Number(t[0]) : null;
      b = t[1] != null ? Number(t[1]) : null;
      c = t[2] != null ? Number(t[2]) : null;
      if (Number.isNaN(a)) a = null;
      if (Number.isNaN(b)) b = null;
      if (Number.isNaN(c)) c = null;
    }
    const legacyRaw = row[SKINFOLD_LEGACY_COL[site]] ?? row[SKINFOLD_LEGACY_CAMEL[site]];
    const legNum = legacyRaw != null && legacyRaw !== '' ? Number(legacyRaw) : null;
    const legOk = legNum != null && !Number.isNaN(legNum);
    if (a == null && b == null && c == null && legOk) {
      a = legNum;
    }
    out[site] = [a, b, c];
  }
  return out;
};

const buildSkinfoldReadingsForDB = (skinFoldReadings) => {
  if (!skinFoldReadings || typeof skinFoldReadings !== 'object') return null;
  const json = {};
  let any = false;
  for (const site of SKINFOLD_SITES) {
    const arr = skinFoldReadings[site];
    if (!Array.isArray(arr)) continue;
    const triple = [0, 1, 2].map((i) => {
      const v = arr[i];
      if (v == null || v === '') return null;
      const n = Number(v);
      return Number.isNaN(n) ? null : n;
    });
    if (triple.some((v) => v != null)) {
      json[site] = triple;
      any = true;
    }
  }
  return any ? json : null;
};

/** PostgREST / Postgres when measurements.skinfold_readings column is not migrated yet */
const isSkinfoldReadingsColumnError = (error) => {
  if (!error) return false;
  const blob = [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(' ');
  return /skinfold_readings/i.test(blob);
};

/** PostgREST when `measurements` is missing or not in the schema cache (common after new projects / migrations). */
const improveMeasurementApiError = (error) => {
  if (!error) return error;
  const code = String(error.code ?? '');
  const blob = [error.message, error.details, error.hint, code].filter(Boolean).join(' ');
  if (
    /PGRST205/i.test(code) ||
    (/schema cache/i.test(blob) && /measurement/i.test(blob)) ||
    /could not find the ['"]?public\.measurements/i.test(blob) ||
    /relation ['"]?public\.measurements['"]? does not exist/i.test(blob)
  ) {
    console.error('[measurements API]', { code, message: error.message, details: error.details, hint: error.hint });
    return new Error(
      'Supabase could not find the measurements table. Fix: in your code editor open the file 012_measurements_supabase_fix.sql, select all text (Ctrl+A), copy, paste into Supabase Dashboard → SQL → New query, Run. Do not paste the file path into the editor.'
    );
  }
  return error;
};

const omitUndefined = (obj) => {
  const out = { ...obj };
  Object.keys(out).forEach((k) => {
    if (out[k] === undefined) delete out[k];
  });
  return out;
};

// Helper function to convert measurement from DB format to app format
const mapMeasurementFromDB = (measurement) => {
  if (!measurement) return null;
  // Convert date from ISO string to timestamp number for compatibility
  let dateValue = measurement.date;
  if (dateValue && typeof dateValue === 'string') {
    dateValue = new Date(dateValue).getTime();
  }

  const rawSr = measurement.skinfoldReadings;
  const skinfoldReadings =
    rawSr && typeof rawSr === 'object' && !Array.isArray(rawSr)
      ? rawSr
      : parseSkinfoldReadingsFromRow(measurement);

  return {
    ...measurement,
    clientId: measurement.client_id,
    date: dateValue,
    thighLower: measurement.thigh_lower,
    skinfoldReadings,
    chestSkinfold: averageSkinfoldTriple(skinfoldReadings.chest),
    abdominalSkinfold: averageSkinfoldTriple(skinfoldReadings.abdominal),
    thighSkinfold: averageSkinfoldTriple(skinfoldReadings.thigh),
    tricepSkinfold: averageSkinfoldTriple(skinfoldReadings.tricep),
    subscapularSkinfold: averageSkinfoldTriple(skinfoldReadings.subscapular),
    suprailiacSkinfold: averageSkinfoldTriple(skinfoldReadings.suprailiac),
  };
};

/** Persist measurement instant as ISO string for TIMESTAMPTZ (handles ms number, ISO string, invalid fallback). */
const normalizeMeasurementDateToIso = (dateValue) => {
  if (dateValue == null || dateValue === '') {
    return new Date().toISOString();
  }
  if (typeof dateValue === 'number') {
    if (!Number.isFinite(dateValue)) return new Date().toISOString();
    const d = new Date(dateValue);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }
  if (typeof dateValue === 'string') {
    const trimmed = dateValue.trim();
    if (!trimmed) return new Date().toISOString();
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
};

// Helper function to convert measurement from app format to DB format
const mapMeasurementToDB = (measurement) => {
  const dateValue = normalizeMeasurementDateToIso(measurement.date);

  return {
    client_id: measurement.clientId,
    date: dateValue, // TIMESTAMPTZ
    weight: measurement.weight || null,
    neck: measurement.neck || null,
    shoulders: measurement.shoulders || null,
    chest: measurement.chest || null,
    waist: measurement.waist || null,
    hips: measurement.hips || null,
    hips_lower: measurement.hipsLower || null,
    thigh: measurement.thigh || null,
    thigh_lower: measurement.thighLower || null,
    arm: measurement.arm || null,
    skinfold_readings: buildSkinfoldReadingsForDB(measurement.skinfoldReadings),
    chest_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.chest) ?? measurement.chestSkinfold ?? null,
    abdominal_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.abdominal) ?? measurement.abdominalSkinfold ?? null,
    thigh_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.thigh) ?? measurement.thighSkinfold ?? null,
    tricep_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.tricep) ?? measurement.tricepSkinfold ?? null,
    subscapular_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.subscapular) ??
      measurement.subscapularSkinfold ??
      null,
    suprailiac_skinfold:
      averageSkinfoldTriple(measurement.skinfoldReadings?.suprailiac) ??
      measurement.suprailiacSkinfold ??
      null,
    notes: measurement.notes || null,
  };
};

// Measurement operations
export const addMeasurement = async (measurement) => {
  try {
    const dbMeasurement = mapMeasurementToDB(measurement);
    const row = omitUndefined({
      ...dbMeasurement,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    let { data, error } = await supabase.from('measurements').insert([row]).select().single();

    if (error && row.skinfold_readings != null && isSkinfoldReadingsColumnError(error)) {
      const { skinfold_readings, ...withoutSr } = row;
      console.warn(
        'measurements.skinfold_readings column missing; saved legacy skinfold averages only. Apply supabase/migrations/011_skinfold_readings.sql'
      );
      ({ data, error } = await supabase
        .from('measurements')
        .insert([withoutSr])
        .select()
        .single());
    }

    if (error) throw improveMeasurementApiError(error);
    const parsedData = mapMeasurementFromDB(data);
    console.log('Measurement saved for client:', measurement.clientId);
    return parsedData;
  } catch (error) {
    console.error('Error adding measurement:', error);
    throw improveMeasurementApiError(error);
  }
};

export const updateMeasurement = async (id, updates) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    // Map camelCase to snake_case
    if (updates.clientId !== undefined) updateData.client_id = updates.clientId;
    if (updates.date !== undefined) {
      updateData.date = normalizeMeasurementDateToIso(updates.date);
    }
    if (updates.weight !== undefined) updateData.weight = updates.weight;
    if (updates.neck !== undefined) updateData.neck = updates.neck;
    if (updates.shoulders !== undefined) updateData.shoulders = updates.shoulders;
    if (updates.chest !== undefined) updateData.chest = updates.chest;
    if (updates.waist !== undefined) updateData.waist = updates.waist;
    if (updates.hips !== undefined) updateData.hips = updates.hips;
    if (updates.thigh !== undefined) updateData.thigh = updates.thigh;
    if (updates.thighLower !== undefined) updateData.thigh_lower = updates.thighLower;
    if (updates.hipsLower !== undefined) updateData.hips_lower = updates.hipsLower;
    if (updates.arm !== undefined) updateData.arm = updates.arm;
    if (updates.skinfoldReadings !== undefined) {
      updateData.skinfold_readings = buildSkinfoldReadingsForDB(updates.skinfoldReadings);
      updateData.chest_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.chest);
      updateData.abdominal_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.abdominal);
      updateData.thigh_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.thigh);
      updateData.tricep_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.tricep);
      updateData.subscapular_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.subscapular);
      updateData.suprailiac_skinfold = averageSkinfoldTriple(updates.skinfoldReadings?.suprailiac);
    }
    if (updates.chestSkinfold !== undefined) updateData.chest_skinfold = updates.chestSkinfold;
    if (updates.abdominalSkinfold !== undefined) updateData.abdominal_skinfold = updates.abdominalSkinfold;
    if (updates.thighSkinfold !== undefined) updateData.thigh_skinfold = updates.thighSkinfold;
    if (updates.tricepSkinfold !== undefined) updateData.tricep_skinfold = updates.tricepSkinfold;
    if (updates.subscapularSkinfold !== undefined) updateData.subscapular_skinfold = updates.subscapularSkinfold;
    if (updates.suprailiacSkinfold !== undefined) updateData.suprailiac_skinfold = updates.suprailiacSkinfold;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const payload = omitUndefined(updateData);

    let { data, error } = await supabase.from('measurements').update(payload).eq('id', id).select().single();

    if (error && payload.skinfold_readings !== undefined && isSkinfoldReadingsColumnError(error)) {
      const { skinfold_readings, ...withoutSr } = payload;
      console.warn(
        'measurements.skinfold_readings column missing; updated legacy skinfold averages only. Apply supabase/migrations/011_skinfold_readings.sql'
      );
      ({ data, error } = await supabase
        .from('measurements')
        .update(withoutSr)
        .eq('id', id)
        .select()
        .single());
    }

    if (error) throw improveMeasurementApiError(error);
    return mapMeasurementFromDB(data);
  } catch (error) {
    console.error('Error updating measurement:', error);
    throw improveMeasurementApiError(error);
  }
};

export const deleteMeasurement = async (id) => {
  try {
    const { error } = await supabase
      .from('measurements')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting measurement:', error);
    throw error;
  }
};

export const getMeasurement = async (id) => {
  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapMeasurementFromDB(data);
  } catch (error) {
    console.error('Error getting measurement:', error);
    return null;
  }
};

export const getAllMeasurements = async () => {
  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;
    const parsedData = (data || []).map(mapMeasurementFromDB);
    console.log(`Retrieved ${parsedData.length} measurements from Supabase`);
    return parsedData;
  } catch (error) {
    console.error('Error getting all measurements:', error);
    return [];
  }
};

export const getMeasurementsByClient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapMeasurementFromDB);
  } catch (error) {
    console.error('Error getting measurements by client:', error);
    return [];
  }
};

// Helper function to convert template from DB format to app format
const mapTemplateFromDB = (template) => {
  if (!template) return null;
  return {
    ...template,
    exercises: typeof template.exercises === 'string' ? JSON.parse(template.exercises) : template.exercises,
  };
};

// Workout Template operations
export const addWorkoutTemplate = async (template) => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .insert([{
        name: template.name || 'Unnamed Workout',
        exercises: JSON.stringify(template.exercises || []), // Store as JSON string
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;
    const parsedData = mapTemplateFromDB(data);
    console.log('Workout template saved:', parsedData.name);
    return parsedData;
  } catch (error) {
    console.error('Error adding workout template:', error);
    throw error;
  }
};

export const updateWorkoutTemplate = async (id, updates) => {
  try {
    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) updateData.name = updates.name;
    // If exercises are being updated, stringify them
    if (updates.exercises) {
      updateData.exercises = JSON.stringify(updates.exercises);
    }

    const { data, error } = await supabase
      .from('workout_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return mapTemplateFromDB(data);
  } catch (error) {
    console.error('Error updating workout template:', error);
    throw error;
  }
};

export const deleteWorkoutTemplate = async (id) => {
  try {
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    console.log('Workout template deleted:', id);
  } catch (error) {
    console.error('Error deleting workout template:', error);
    throw error;
  }
};

export const getWorkoutTemplate = async (id) => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return mapTemplateFromDB(data);
  } catch (error) {
    console.error('Error getting workout template:', error);
    return null;
  }
};

export const getAllWorkoutTemplates = async () => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const parsedData = (data || []).map(mapTemplateFromDB);
    console.log(`Retrieved ${parsedData.length} workout templates from Supabase`);
    return parsedData;
  } catch (error) {
    console.error('Error getting all workout templates:', error);
    return [];
  }
};

// Database health check
export const checkDatabaseHealth = async () => {
  if (!isSupabaseConfigured) {
    return null; // Return null if not configured, IndexedDB will handle its own health check
  }
  try {
    const [clientsResult, exercisesResult, workoutsResult, measurementsResult, templatesResult] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('exercises').select('id', { count: 'exact', head: true }),
      supabase.from('workouts').select('id', { count: 'exact', head: true }),
      supabase.from('measurements').select('id', { count: 'exact', head: true }),
      supabase.from('workout_templates').select('id', { count: 'exact', head: true }),
    ]);

    const counts = {
      clients: clientsResult.count || 0,
      exercises: exercisesResult.count || 0,
      workouts: workoutsResult.count || 0,
      measurements: measurementsResult.count || 0,
      templates: templatesResult.count || 0,
    };

    console.log(`Database health check: ${counts.clients} clients, ${counts.exercises} exercises, ${counts.workouts} workouts, ${counts.measurements} measurements, ${counts.templates} templates`);
    
    return {
      stores: ['clients', 'exercises', 'workouts', 'measurements', 'workout_templates'],
      counts,
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return null;
  }
};

// Export all data for backup
export const exportAllData = async () => {
  try {
    const [clients, exercises, workouts, measurements, templates] = await Promise.all([
      getAllClients(),
      getAllExercises(),
      getAllWorkouts(),
      getAllMeasurements(),
      getAllWorkoutTemplates(),
    ]);

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: {
        clients,
        exercises,
        workouts,
        measurements,
        workoutTemplates: templates,
      },
    };

    return exportData;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Import data from backup
export const importAllData = async (importData, options = { overwrite: false }) => {
  try {
    const { data } = importData;
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid import data format');
    }

    const results = {
      clients: { imported: 0, errors: 0 },
      exercises: { imported: 0, errors: 0 },
      workouts: { imported: 0, errors: 0 },
      measurements: { imported: 0, errors: 0 },
      templates: { imported: 0, errors: 0 },
    };

    // Import clients
    if (Array.isArray(data.clients)) {
      try {
        if (options.overwrite) {
          // Delete all existing and insert new
          await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
        }
        const newClients = await addClientsBatch(data.clients);
        results.clients.imported = newClients.length;
      } catch (error) {
        console.error('Error importing clients:', error);
        results.clients.errors = data.clients.length;
      }
    }

    // Import exercises
    if (Array.isArray(data.exercises)) {
      try {
        if (options.overwrite) {
          await supabase.from('exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        }
        const newExercises = await addExercisesBatch(data.exercises);
        results.exercises.imported = newExercises.length;
      } catch (error) {
        console.error('Error importing exercises:', error);
        results.exercises.errors = data.exercises.length;
      }
    }

    // Import workouts
    if (Array.isArray(data.workouts)) {
      for (const workout of data.workouts) {
        try {
          if (options.overwrite) {
            await deleteWorkout(workout.id);
          }
          await addWorkout(workout);
          results.workouts.imported++;
        } catch (error) {
          console.error('Error importing workout:', error);
          results.workouts.errors++;
        }
      }
    }

    // Import measurements
    if (Array.isArray(data.measurements)) {
      for (const measurement of data.measurements) {
        try {
          if (options.overwrite) {
            await deleteMeasurement(measurement.id);
          }
          await addMeasurement(measurement);
          results.measurements.imported++;
        } catch (error) {
          console.error('Error importing measurement:', error);
          results.measurements.errors++;
        }
      }
    }

    // Import templates
    if (Array.isArray(data.workoutTemplates || data.templates)) {
      const templates = data.workoutTemplates || data.templates;
      for (const template of templates) {
        try {
          if (options.overwrite) {
            await deleteWorkoutTemplate(template.id);
          }
          await addWorkoutTemplate(template);
          results.templates.imported++;
        } catch (error) {
          console.error('Error importing template:', error);
          results.templates.errors++;
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};
