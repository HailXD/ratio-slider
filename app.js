const DEFAULT_WIDTH = 1216;
const DEFAULT_HEIGHT = 896;
const RANGE_MULTIPLIER = 4;
const PREVIEW_SIZE = 220;

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

const numberFormat = new Intl.NumberFormat("en-US");

const parseDimension = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }
  return Math.floor(parsed);
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

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
  let height = Math.floor(Math.sqrt(pixels / ratio));
  if (height < 1) {
    height = 1;
  }
  let width = Math.floor(height * ratio);
  if (width < 1) {
    width = 1;
  }
  let usedPixels = width * height;
  if (usedPixels > pixels) {
    height = Math.floor(pixels / width);
    usedPixels = width * height;
  }
  return { width, height, pixels: usedPixels };
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
  const ratio = Number(ratioSlider.value);
  ratioValue.textContent = ratio > 0 ? ratio.toFixed(3) : "0";
  const nextSize = computeNewSize(pixels, ratio);
  newWidth.textContent = numberFormat.format(nextSize.width);
  newHeight.textContent = numberFormat.format(nextSize.height);
  newPixels.textContent = numberFormat.format(nextSize.pixels);
  updatePreview(nextSize.width, nextSize.height);
};

const updateBase = () => {
  const width = parseDimension(widthInput.value);
  const height = parseDimension(heightInput.value);
  const pixels = width > 0 && height > 0 ? width * height : 0;
  const ratio = height > 0 ? width / height : 0;
  pixelCount.textContent = numberFormat.format(pixels);
  baseRatio.textContent = ratio > 0 ? ratio.toFixed(3) : "0";
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

updateBase();
