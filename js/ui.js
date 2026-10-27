/**
 * UI Utilities for RPI Logo Generator
 */

class Toast {
    static container = null;

    static init() {
        if (!document.getElementById('toast-container')) {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
            this.container = container;
        } else {
            this.container = document.getElementById('toast-container');
        }
    }

    static show(message, type = 'info', duration = 3000) {
        if (!this.container) this.init();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        // Icon based on type
        const iconName = type === 'success' ? 'check' : type === 'error' ? 'x-circle' : 'info';
        const iconSvg = window.FeatherIcons.getIconMarkup(iconName, 'toast_icon');

        toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-message">${message}</div>
    `;

        this.container.appendChild(toast);

        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'fadeOutRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            toast.addEventListener('animationend', () => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            });
        }, duration);
    }
}

// Expose globally
window.Toast = Toast;
