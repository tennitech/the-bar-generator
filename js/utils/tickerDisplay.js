function getTickerWidthRatioMax(countRatio) {
  const ratio = parseInt(countRatio, 10);

  switch (ratio) {
    case 1:
      return 2;
    case 2:
      return 3;
    case 4:
      return 7;
    case 5:
      return 10;
    case 3:
    default:
      return 5;
  }
}

function applyTickerWidthRatioBounds(countRatioElement, widthRatioElement) {
  if (!widthRatioElement) {
    return;
  }

  const max = getTickerWidthRatioMax(countRatioElement ? countRatioElement.value : 3);
  widthRatioElement.max = `${max}`;

  const currentValue = parseInt(widthRatioElement.value, 10);
  if (!Number.isFinite(currentValue) || currentValue < 1) {
    widthRatioElement.value = '1';
  } else if (currentValue > max) {
    widthRatioElement.value = `${max}`;
  }
}

function setTickerWidthRatioDisplayValue(sliderElement, displayElement) {
  if (!sliderElement || !displayElement) {
    return;
  }

  const sliderValue = parseInt(sliderElement.value, 10);
  displayElement.textContent = `1:${sliderValue}`;
}

if (typeof window !== 'undefined') {
  window.applyTickerWidthRatioBounds = applyTickerWidthRatioBounds;
  window.getTickerWidthRatioMax = getTickerWidthRatioMax;
  window.setTickerWidthRatioDisplayValue = setTickerWidthRatioDisplayValue;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    applyTickerWidthRatioBounds,
    getTickerWidthRatioMax,
    setTickerWidthRatioDisplayValue
  };
}
