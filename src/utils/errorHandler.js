import { showToast } from './toast';

/**
 * Error handling wrapper for IndexedDB operations
 * Provides retry functionality and user-friendly error messages
 */
export const withErrorHandling = async (operation, options = {}) => {
  const {
    retries = 3,
    retryDelay = 1000,
    errorMessage = 'Operation failed',
    successMessage = null,
    onRetry = null,
    onError = null,
  } = options;

  let lastError = null;
  let attempt = 0;

  while (attempt < retries) {
    try {
      const result = await operation();
      
      // Show success message if provided
      if (successMessage) {
        showToast(successMessage, { type: 'success' });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      attempt++;
      
      // Log error for debugging
      console.error(`Operation failed (attempt ${attempt}/${retries}):`, error);
      
      // Call custom error handler if provided
      if (onError) {
        onError(error, attempt);
      }
      
      // If this is not the last attempt, wait and retry
      if (attempt < retries) {
        if (onRetry) {
          onRetry(attempt, retries);
        }
        
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed - show error toast
  const finalErrorMessage = lastError?.message || errorMessage;
  showToast(`${finalErrorMessage}. Please try again.`, { type: 'error', duration: 5000 });
  
  // Throw error so calling code can handle it
  throw lastError;
};

/**
 * Creates a retry UI component that can be used in error states
 */
export const createRetryUI = (onRetry, errorMessage = 'Operation failed') => {
  return {
    message: errorMessage,
    onRetry,
    showRetry: true,
  };
};
