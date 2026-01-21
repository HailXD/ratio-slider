const DEFAULT_WIDTH = 1216;
const DEFAULT_HEIGHT = 896;
const RANGE_MULTIPLIER = 4;
const PREVIEW_SIZE = 220;
const DIM_STEP = 16;

const widthInput = document.getElementById("widthInput");
const heightInput = document.getElementById("heightInput");
const pixelCount = document.getElementById("pixelCount");
const baseRatio = document.getElementById("baseRatio");
const ratioSlider = document.getElementById("ratioSlider");
const ratioValue = document.getElementById("ratioValue");
const newWidth = document.getElementById("newWidth");
const newHeight = document.getElementById("newHeight");
const newPixels = document.getElementById("newPixels");
const previewBox = document.getElementById("previewBox");
const presetButtons = document.querySelectorAll(".preset-button");

const numberFormat = new Intl.NumberFormat("en-US");

const parseDimension = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < DIM_STEP) {
    return 0;
  }
  return Math.floor(parsed / DIM_STEP) * DIM_STEP;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const floorToStep = (value, step) => Math.floor(value / step) * step;
const ceilToStep = (value, step) => Math.ceil(value / step) * step;

const gcd = (a, b) => {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const temp = y;
    y = x % y;
    x = temp;
  }
  return x;
};

const formatRatioDisplay = (ratio, numerator, denominator) => {
  if (ratio <= 0 || numerator <= 0 || denominator <= 0) {
    return "0";
  }
  return `${ratio.toFixed(3)} (${numerator}:${denominator})`;
};

const updateSliderRange = (ratio, pixels) => {
  if (ratio <= 0 || pixels <= 0) {
    ratioSlider.min = "0";
    ratioSlider.max = "1";
    ratioSlider.step = "0.01";
    ratioSlider.disabled = true;
    return;
  }
  const minRatio = Math.max(1 / pixels, ratio / RANGE_MULTIPLIER);
  const maxRatio = Math.min(pixels, ratio * RANGE_MULTIPLIER);
  const step = Math.max(0.001, (maxRatio - minRatio) / 250);
  ratioSlider.min = minRatio.toFixed(6);
  ratioSlider.max = maxRatio.toFixed(6);
  ratioSlider.step = step.toFixed(6);
  ratioSlider.disabled = false;
};

const computeNewSize = (pixels, ratio) => {
  if (pixels <= 0 || ratio <= 0) {
    return { width: 0, height: 0, pixels: 0 };
  }
  const idealHeight = Math.sqrt(pixels / ratio);
  const idealWidth = idealHeight * ratio;
  const heightUp = Math.max(DIM_STEP, ceilToStep(idealHeight, DIM_STEP));
  const widthDownFromHeightUp = floorToStep(pixels / heightUp, DIM_STEP);
  const candidateA =
    widthDownFromHeightUp >= DIM_STEP
      ? {
          width: widthDownFromHeightUp,
          height: heightUp,
          pixels: widthDownFromHeightUp * heightUp,
        }
      : null;
  const widthUp = Math.max(DIM_STEP, ceilToStep(idealWidth, DIM_STEP));
  const heightDownFromWidthUp = floorToStep(pixels / widthUp, DIM_STEP);
  const candidateB =
    heightDownFromWidthUp >= DIM_STEP
      ? {
          width: widthUp,
          height: heightDownFromWidthUp,
          pixels: widthUp * heightDownFromWidthUp,
        }
      : null;
  if (candidateA && candidateB) {
    const ratioA = candidateA.width / candidateA.height;
    const ratioB = candidateB.width / candidateB.height;
    const errorA = Math.abs(ratioA - ratio);
    const errorB = Math.abs(ratioB - ratio);
    if (errorA === errorB) {
      return candidateA.pixels >= candidateB.pixels ? candidateA : candidateB;
    }
    return errorA < errorB ? candidateA : candidateB;
  }
  if (candidateA) {
    return candidateA;
  }
  if (candidateB) {
    return candidateB;
  }
  return { width: 0, height: 0, pixels: 0 };
};

const updatePreview = (width, height) => {
  if (width <= 0 || height <= 0) {
    previewBox.style.width = "0px";
    previewBox.style.height = "0px";
    return;
  }
  const ratio = width / height;
  let displayWidth = PREVIEW_SIZE;
  let displayHeight = PREVIEW_SIZE;
  if (ratio >= 1) {
    displayHeight = Math.max(8, Math.round(PREVIEW_SIZE / ratio));
  } else {
    displayWidth = Math.max(8, Math.round(PREVIEW_SIZE * ratio));
  }
  previewBox.style.width = `${displayWidth}px`;
  previewBox.style.height = `${displayHeight}px`;
};

const updateDerived = () => {
  const width = parseDimension(widthInput.value);
  const height = parseDimension(heightInput.value);
  const pixels = width > 0 && height > 0 ? width * height : 0;
  const targetRatio = Number(ratioSlider.value);
  const nextSize = computeNewSize(pixels, targetRatio);
  const actualRatio =
    nextSize.width > 0 && nextSize.height > 0
      ? nextSize.width / nextSize.height
      : 0;
  const divisor =
    nextSize.width > 0 && nextSize.height > 0
      ? gcd(nextSize.width, nextSize.height)
      : 0;
  const ratioNumerator = divisor > 0 ? nextSize.width / divisor : 0;
  const ratioDenominator = divisor > 0 ? nextSize.height / divisor : 0;
  ratioValue.textContent = formatRatioDisplay(
    actualRatio,
    ratioNumerator,
    ratioDenominator
  );
  newWidth.textContent = numberFormat.format(nextSize.width);
  newHeight.textContent = numberFormat.format(nextSize.height);
  newPixels.textContent = numberFormat.format(nextSize.pixels);
  updatePreview(nextSize.width, nextSize.height);
  if (!ratioSlider.disabled && actualRatio > 0) {
    const minRatio = Number(ratioSlider.min);
    const maxRatio = Number(ratioSlider.max);
    ratioSlider.value = clamp(actualRatio, minRatio, maxRatio).toFixed(6);
  }
};

const updateBase = () => {
  const width = parseDimension(widthInput.value);
  const height = parseDimension(heightInput.value);
  if (width >= DIM_STEP && Number(widthInput.value) !== width) {
    widthInput.value = width;
  }
  if (height >= DIM_STEP && Number(heightInput.value) !== height) {
    heightInput.value = height;
  }
  const pixels = width > 0 && height > 0 ? width * height : 0;
  const ratio = height > 0 ? width / height : 0;
  const divisor = width > 0 && height > 0 ? gcd(width, height) : 0;
  const ratioNumerator = divisor > 0 ? Math.floor(width / divisor) : 0;
  const ratioDenominator = divisor > 0 ? Math.floor(height / divisor) : 0;
  pixelCount.textContent = numberFormat.format(pixels);
  baseRatio.textContent = formatRatioDisplay(
    ratio,
    ratioNumerator,
    ratioDenominator
  );
  updateSliderRange(ratio, pixels);
  if (!ratioSlider.disabled) {
    const minRatio = Number(ratioSlider.min);
    const maxRatio = Number(ratioSlider.max);
    ratioSlider.value = clamp(ratio, minRatio, maxRatio).toFixed(6);
  }
  updateDerived();
};

widthInput.value = DEFAULT_WIDTH;
heightInput.value = DEFAULT_HEIGHT;

widthInput.addEventListener("input", updateBase);
heightInput.addEventListener("input", updateBase);
ratioSlider.addEventListener("input", updateDerived);
presetButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const ratio = Number(button.dataset.ratio);
    if (!Number.isFinite(ratio) || ratio <= 0) {
      return;
    }
    const minRatio = Number(ratioSlider.min);
    const maxRatio = Number(ratioSlider.max);
    ratioSlider.value = clamp(ratio, minRatio, maxRatio).toFixed(6);
    updateDerived();
  });
});

updateBase();
