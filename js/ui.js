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
        for (const [id, role] of [['toast-status', 'status'], ['toast-alert', 'alert']]) {
            if (document.getElementById(id)) continue;
            const live = document.createElement('div');
            live.id = id;
            live.className = 'u-sr-only';
            live.setAttribute('role', role);
            live.setAttribute('aria-atomic', 'true');
            document.body.appendChild(live);
        }
    }

    // Quiet outcomes use the existing persistent status region without a toast.
    static announce(message) {
        if (!this.container) this.init();
        const live = document.getElementById('toast-status');
        live.textContent = '';
        requestAnimationFrame(() => { live.textContent = String(message); });
    }

    static show(message, type = 'info', duration = type === 'error' ? 6000 : 4000) {
        if (!this.container) this.init();
        // Repeat outcomes replace themselves rather than piling up identical notices.
        for (const previous of Array.from(this.container.children)) {
            if (previous.querySelector('.toast-message')?.textContent === String(message)) previous.remove();
        }
        while (this.container.children.length >= 3) this.container.firstElementChild.remove();
        const toast = document.createElement('div');
        const previousFocus = document.activeElement;
        toast.className = `toast ${type}`;
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.setAttribute('aria-hidden', 'true');
        const iconName = type === 'success' ? 'check' : type === 'error' ? 'x-circle' : 'info';
        icon.innerHTML = window.FeatherIcons.getIconMarkup(iconName, 'toast_icon');
        const text = document.createElement('div');
        text.className = 'toast-message';
        const dismiss = document.createElement('button');
        dismiss.type = 'button';
        dismiss.className = 'toast_dismiss';
        dismiss.setAttribute('aria-label', 'Dismiss message');
        dismiss.innerHTML = window.FeatherIcons.getIconMarkup('x', 'toast_dismiss-icon');
        toast.append(icon, text, dismiss);
        this.container.appendChild(toast);
        // Keep a persistent live region; a newly inserted status with content
        // is not announced consistently. The visible message remains immediate.
        text.textContent = String(message);
        const live = document.getElementById(type === 'error' ? 'toast-alert' : 'toast-status');
        live.textContent = '';
        requestAnimationFrame(() => { if (toast.isConnected) live.textContent = String(message); });
        let timer;
        const remove = () => {
            clearTimeout(timer);
            const restoreFocus = toast.contains(document.activeElement);
            toast.remove();
            if (restoreFocus && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
        };
        const schedule = () => {
            clearTimeout(timer);
            if (duration > 0) timer = setTimeout(remove, duration);
        };
        dismiss.addEventListener('click', remove);
        toast.addEventListener('pointerenter', () => clearTimeout(timer));
        toast.addEventListener('pointerleave', () => { if (!toast.contains(document.activeElement)) schedule(); });
        toast.addEventListener('focusin', () => clearTimeout(timer));
        toast.addEventListener('focusout', event => { if (!toast.contains(event.relatedTarget)) schedule(); });
        schedule();
    }

}

// Expose globally
window.Toast = Toast;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => Toast.init(), { once: true });
else Toast.init();
