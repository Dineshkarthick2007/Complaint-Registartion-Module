import { sound } from './sound.js';
import { icons } from './icons.js';

class ToastManager {
  constructor() {
    this.container = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = document.getElementById('toastContainer');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toastContainer';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
      }
    }
    return this.container;
  }

  /**
   * Show a toast message
   * @param {string} title
   * @param {string} message
   * @param {'success'|'info'|'warning'|'danger'} type
   * @param {number} duration
   */
  show(title, message = '', type = 'info', duration = 4000) {
    const container = this.ensureContainer();

    const toastIcons = {
      success: icons.checkCircle,
      info: icons.layers,
      warning: icons.alertTriangle,
      danger: icons.alertTriangle
    };

    if (type === 'success') sound.playSuccess();
    else if (type === 'warning' || type === 'info') sound.playStatusUpdate();
    else if (type === 'danger') sound.playUrgentAlert();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${toastIcons[type] || icons.layers}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">${icons.x}</button>
    `;

    const closeBtn = toast.querySelector('.toast-close');
    const dismiss = () => {
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentElement) toast.parentElement.removeChild(toast);
      }, 200);
    };

    closeBtn.addEventListener('click', dismiss);
    container.appendChild(toast);

    if (duration > 0) {
      setTimeout(dismiss, duration);
    }
  }

  success(title, message, duration) {
    this.show(title, message, 'success', duration);
  }

  info(title, message, duration) {
    this.show(title, message, 'info', duration);
  }

  warning(title, message, duration) {
    this.show(title, message, 'warning', duration);
  }

  danger(title, message, duration) {
    this.show(title, message, 'danger', duration);
  }
}

export const toast = new ToastManager();
