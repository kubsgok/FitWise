export const saveWorkoutSession = (data) => {
    try {
      // Get existing sessions
      const sessions = getWorkoutSessions();
      
      // Add new session
      const newSession = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...data
      };
      
      sessions.push(newSession);
      
      // Save to localStorage
      localStorage.setItem('workoutSessions', JSON.stringify(sessions));
      
      return newSession;
    } catch (error) {
      console.error('Error saving workout session:', error);
      return null;
    }
  };
  
  export const getWorkoutSessions = () => {
    try {
      const sessions = localStorage.getItem('workoutSessions');
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting workout sessions:', error);
      return [];
    }
  };
  
  export const getSessionById = (id) => {
    const sessions = getWorkoutSessions();
    return sessions.find(session => session.id === id);
  };
  
  export const deleteSession = (id) => {
    try {
      const sessions = getWorkoutSessions();
      const filtered = sessions.filter(session => session.id !== id);
      localStorage.setItem('workoutSessions', JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error deleting session:', error);
      return false;
    }
  };
  
  export const clearAllSessions = () => {
    try {
      localStorage.removeItem('workoutSessions');
      return true;
    } catch (error) {
      console.error('Error clearing sessions:', error);
      return false;
    }
  };
  
  // Body scan data
  export const saveBodyScanData = (bodyScanData) => {
    try {
      const scans = getBodyScans();
      
      const newScan = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        ...bodyScanData
      };
      
      scans.push(newScan);
      localStorage.setItem('bodyScans', JSON.stringify(scans));
      
      return newScan;
    } catch (error) {
      console.error('Error saving body scan:', error);
      return null;
    }
  };
  
  export const getBodyScans = () => {
    try {
      const scans = localStorage.getItem('bodyScans');
      return scans ? JSON.parse(scans) : [];
    } catch (error) {
      console.error('Error getting body scans:', error);
      return [];
    }
  };
  
  export const getLatestBodyScan = () => {
    const scans = getBodyScans();
    return scans.length > 0 ? scans[scans.length - 1] : null;
  };