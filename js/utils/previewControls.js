(function (root, factory) {
  const registry = typeof module !== 'undefined' && module.exports ? require('./featherIcons') : root.FeatherIcons;
  const api = factory(registry);

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.previewControlUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (registry) {
  const ICONS = {
    play: registry.getIconMarkup('play', 'preview-control-btn_glyph preview-control-btn_glyph-play'),
    pause: registry.getIconMarkup('pause', 'preview-control-btn_glyph preview-control-btn_glyph-pause'),
    audioOn: registry.getIconMarkup('volume-2', 'preview-control-btn_glyph preview-control-btn_glyph-audio-on'),
    audioOff: registry.getIconMarkup('volume-x', 'preview-control-btn_glyph preview-control-btn_glyph-audio-off')
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
