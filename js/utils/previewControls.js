(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.previewControlUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ICONS = {
    play: [
      '<svg class="preview-control-btn_glyph preview-control-btn_glyph-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
      '<path d="M8 6.25v11.5a.75.75 0 0 0 1.14.644l8.78-5.75a.75.75 0 0 0 0-1.288l-8.78-5.75A.75.75 0 0 0 8 6.25Z"/>',
      '</svg>'
    ].join(''),
    pause: [
      '<svg class="preview-control-btn_glyph preview-control-btn_glyph-pause" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">',
      '<path d="M8.5 5.5h2.75A.75.75 0 0 1 12 6.25v11.5a.75.75 0 0 1-.75.75H8.5a.75.75 0 0 1-.75-.75V6.25a.75.75 0 0 1 .75-.75Zm4.25.75a.75.75 0 0 1 .75-.75h2.75a.75.75 0 0 1 .75.75v11.5a.75.75 0 0 1-.75.75H13.5a.75.75 0 0 1-.75-.75V6.25Z"/>',
      '</svg>'
    ].join(''),
    audioOn: [
      '<svg class="preview-control-btn_glyph preview-control-btn_glyph-audio-on" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M5 14h3l4 4V6L8 10H5z"/>',
      '<path d="M16 9.5a4.5 4.5 0 0 1 0 5"/>',
      '<path d="M18.5 7a8 8 0 0 1 0 10"/>',
      '</svg>'
    ].join(''),
    audioOff: [
      '<svg class="preview-control-btn_glyph preview-control-btn_glyph-audio-off" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
      '<path d="M5 14h3l4 4V6L8 10H5z"/>',
      '<path d="M16.5 9.5 20 13"/>',
      '<path d="M20 9.5 16.5 13"/>',
      '</svg>'
    ].join('')
  };

  function getPreviewButtonMarkup(kind) {
    return [
      '<span class="preview-control-btn_icon" aria-hidden="true">',
      kind === 'audio' ? `${ICONS.audioOff}${ICONS.audioOn}` : `${ICONS.play}${ICONS.pause}`,
      '</span>',
      '<span class="preview-control-btn_sr">Play preview</span>'
    ].join('');
  }

  function getPreviewButtonState(kind, options = {}) {
    const active = !!options.active;
    const disabled = !!options.disabled;
    const disabledReason = String(options.disabledReason || 'Unavailable');

    if (kind === 'motion') {
      if (active) {
        return {
          icon: 'pause',
          actionText: 'Pause',
          ariaLabel: 'Pause motion preview',
          active: true,
          animated: true,
          disabled: false
        };
      }

      return {
        icon: 'play',
        actionText: 'Play',
        ariaLabel: 'Play motion preview',
        active: false,
        animated: false,
        disabled: false
      };
    }

    if (disabled) {
      return {
        icon: 'audio-off',
        actionText: 'Play',
        statusText: disabledReason,
        ariaLabel: 'Audio preview unavailable',
        active: false,
        animated: false,
        disabled: true
      };
    }

    if (active) {
      return {
        icon: 'audio-on',
        actionText: 'Mute',
        ariaLabel: 'Pause audio preview',
        active: true,
        animated: true,
        disabled: false
      };
    }

    return {
      icon: 'audio-off',
      actionText: 'Play',
      ariaLabel: 'Play audio preview',
      active: false,
      animated: false,
      disabled: false
    };
  }

  return {
    getPreviewButtonMarkup,
    getPreviewButtonState
  };
});
