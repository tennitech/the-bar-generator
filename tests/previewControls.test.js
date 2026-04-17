const {
  getPreviewButtonMarkup,
  getPreviewButtonState
} = require('../js/utils/previewControls');

describe('preview control utils', () => {
  test('returns animated pause-state metadata for active audio transport', () => {
    expect(getPreviewButtonState('audio', { active: true })).toEqual({
      icon: 'audio-on',
      actionText: 'Mute',
      ariaLabel: 'Pause audio preview',
      active: true,
      animated: true,
      disabled: false
    });
  });

  test('returns a disabled guidance state for unavailable staff audio', () => {
    expect(getPreviewButtonState('audio', {
      disabled: true,
      disabledReason: 'Add notes first'
    })).toEqual({
      icon: 'audio-off',
      actionText: 'Play',
      statusText: 'Add notes first',
      ariaLabel: 'Audio preview unavailable',
      active: false,
      animated: false,
      disabled: true
    });
  });

  test('builds audio transport markup with icon states and screen-reader support', () => {
    const markup = getPreviewButtonMarkup('audio');

    expect(markup).toContain('preview-control-btn_glyph-audio-off');
    expect(markup).toContain('preview-control-btn_glyph-audio-on');
    expect(markup).toContain('preview-control-btn_sr');
    expect(markup).not.toContain('preview-control-btn_label');
  });

  test('builds motion transport markup with icon states and no visible label text', () => {
    const markup = getPreviewButtonMarkup('motion');

    expect(markup).toContain('preview-control-btn_glyph-play');
    expect(markup).toContain('preview-control-btn_glyph-pause');
    expect(markup).toContain('preview-control-btn_sr');
    expect(markup).not.toContain('preview-control-btn_label');
  });
});
