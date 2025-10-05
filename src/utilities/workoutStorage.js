// Default workout session structure
const defaultSession = {
  id: null,
  timestamp: null,
  workoutTitle: 'Unknown Workout',
  workoutType: 'general',
  targetReps: 0,
  completedReps: 0,
  duration: 0,
  accuracy: 0,
  averageAccuracy: 0,
  completed: false,
  exercises: [],
  notes: '',
  difficulty: 'medium'
};

// Validate and sanitize workout session data
const validateSessionData = (data) => {
  const validated = { ...defaultSession };
  
  // Required fields with validation
  if (data.workoutTitle && typeof data.workoutTitle === 'string') {
    validated.workoutTitle = data.workoutTitle.trim();
  }
  
  if (data.workoutType && typeof data.workoutType === 'string') {
    validated.workoutType = data.workoutType;
  }
  
  // Numeric fields with validation
  validated.targetReps = Math.max(0, parseInt(data.targetReps) || 0);
  validated.completedReps = Math.max(0, parseInt(data.completedReps) || 0);
  validated.duration = Math.max(0, parseInt(data.duration) || 0);
  validated.accuracy = Math.max(0, Math.min(100, parseInt(data.accuracy) || 0));
  validated.averageAccuracy = Math.max(0, Math.min(100, parseInt(data.averageAccuracy) || data.accuracy || 0));
  
  // Boolean fields
  validated.completed = Boolean(data.completed);
  
  // Array fields
  if (Array.isArray(data.exercises)) {
    validated.exercises = data.exercises.map(exercise => ({
      name: exercise.name || 'Unknown Exercise',
      reps: Math.max(0, parseInt(exercise.reps) || 0),
      accuracy: Math.max(0, Math.min(100, parseInt(exercise.accuracy) || 0)),
      duration: Math.max(0, parseInt(exercise.duration) || 0),
      completed: Boolean(exercise.completed)
    }));
  }
  
  // Optional fields
  if (data.notes && typeof data.notes === 'string') {
    validated.notes = data.notes.trim();
  }
  
  if (data.difficulty && ['easy', 'medium', 'hard'].includes(data.difficulty)) {
    validated.difficulty = data.difficulty;
  }
  
  // Additional workout-specific data
  if (data.pose && typeof data.pose === 'string') {
    validated.pose = data.pose;
  }
  
  if (data.bodyPart && typeof data.bodyPart === 'string') {
    validated.bodyPart = data.bodyPart;
  }
  
  if (data.repAccuracies && Array.isArray(data.repAccuracies)) {
    validated.repAccuracies = data.repAccuracies.map(acc => Math.max(0, Math.min(100, parseInt(acc) || 0)));
  }
  
  return validated;
};

export const saveWorkoutSession = (data) => {
  try {
    // Validate input data
    if (!data || typeof data !== 'object') {
      console.error('Invalid workout data provided');
      return null;
    }
    
    // Get existing sessions
    const sessions = getWorkoutSessions();
    
    // Validate and sanitize the data
    const validatedData = validateSessionData(data);
    
    // Create new session with unique ID and timestamp
    const newSession = {
      ...validatedData,
      id: Date.now() + Math.random(), // More unique ID
      timestamp: new Date().toISOString()
    };
    
    // Add new session
    sessions.push(newSession);
    
    // Save to localStorage with error handling
    try {
      localStorage.setItem('workoutSessions', JSON.stringify(sessions));
    } catch (storageError) {
      // Handle storage quota exceeded
      if (storageError.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, removing oldest sessions');
        // Keep only the last 50 sessions
        const trimmedSessions = sessions.slice(-50);
        localStorage.setItem('workoutSessions', JSON.stringify(trimmedSessions));
      } else {
        throw storageError;
      }
    }
    
    console.log('Workout session saved successfully:', newSession.id);
    return newSession;
  } catch (error) {
    console.error('Error saving workout session:', error);
    return null;
  }
};

export const getWorkoutSessions = () => {
  try {
    const sessions = localStorage.getItem('workoutSessions');
    if (!sessions) return [];
    
    const parsed = JSON.parse(sessions);
    
    // Validate that it's an array
    if (!Array.isArray(parsed)) {
      console.warn('Invalid sessions data format, resetting');
      localStorage.removeItem('workoutSessions');
      return [];
    }
    
    // Validate each session has required fields
    const validSessions = parsed.filter(session => {
      return session && 
             typeof session === 'object' && 
             session.id && 
             session.timestamp;
    });
    
    // If some sessions were invalid, save the cleaned array
    if (validSessions.length !== parsed.length) {
      localStorage.setItem('workoutSessions', JSON.stringify(validSessions));
    }
    
    return validSessions;
  } catch (error) {
    console.error('Error getting workout sessions:', error);
    // Reset storage if data is corrupted
    localStorage.removeItem('workoutSessions');
    return [];
  }
};

export const getSessionById = (id) => {
  try {
    const sessions = getWorkoutSessions();
    return sessions.find(session => session.id === id) || null;
  } catch (error) {
    console.error('Error getting session by ID:', error);
    return null;
  }
};

export const updateSession = (id, updates) => {
  try {
    const sessions = getWorkoutSessions();
    const sessionIndex = sessions.findIndex(session => session.id === id);
    
    if (sessionIndex === -1) {
      console.error('Session not found for update:', id);
      return false;
    }
    
    // Validate and merge updates
    const validatedUpdates = validateSessionData({
      ...sessions[sessionIndex],
      ...updates
    });
    
    sessions[sessionIndex] = validatedUpdates;
    localStorage.setItem('workoutSessions', JSON.stringify(sessions));
    
    return true;
  } catch (error) {
    console.error('Error updating session:', error);
    return false;
  }
};

export const deleteSession = (id) => {
  try {
    const sessions = getWorkoutSessions();
    const filtered = sessions.filter(session => session.id !== id);
    
    if (filtered.length === sessions.length) {
      console.warn('Session not found for deletion:', id);
      return false;
    }
    
    localStorage.setItem('workoutSessions', JSON.stringify(filtered));
    console.log('Session deleted successfully:', id);
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    return false;
  }
};

export const clearAllSessions = () => {
  try {
    localStorage.removeItem('workoutSessions');
    console.log('All sessions cleared successfully');
    return true;
  } catch (error) {
    console.error('Error clearing sessions:', error);
    return false;
  }
};

// Helper function to get session statistics
export const getSessionStats = () => {
  try {
    const sessions = getWorkoutSessions();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageAccuracy: 0,
        totalReps: 0,
        completedSessions: 0
      };
    }
    
    const totalDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalAccuracy = sessions.reduce((sum, s) => sum + (s.averageAccuracy || s.accuracy || 0), 0);
    const totalReps = sessions.reduce((sum, s) => sum + (s.completedReps || 0), 0);
    const completedSessions = sessions.filter(s => s.completed).length;
    
    return {
      totalSessions: sessions.length,
      totalDuration,
      averageAccuracy: Math.round(totalAccuracy / sessions.length),
      totalReps,
      completedSessions
    };
  } catch (error) {
    console.error('Error getting session stats:', error);
    return null;
  }
};

// Helper function to export sessions data
export const exportSessions = () => {
  try {
    const sessions = getWorkoutSessions();
    return {
      exportDate: new Date().toISOString(),
      totalSessions: sessions.length,
      sessions
    };
  } catch (error) {
    console.error('Error exporting sessions:', error);
    return null;
  }
};