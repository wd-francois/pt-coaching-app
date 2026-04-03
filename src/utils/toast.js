export function showToast(message, { type = 'info', duration = 3000 } = {}) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : 'bg-gray-800'} text-white px-4 py-2 rounded-md shadow-md mb-2 pointer-events-auto`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;

  // Dismiss on click
  toast.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => root.removeChild(toast), 300);
  });

  root.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => root.removeChild(toast), 300);
  }, duration);
}
