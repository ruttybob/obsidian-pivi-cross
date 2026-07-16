export function updateContextRowHasContent(contextRowEl: HTMLElement): void {
  const editorIndicator = contextRowEl.querySelector('.yapi-selection-indicator');
  const browserIndicator = contextRowEl.querySelector('.yapi-browser-selection-indicator');
  const canvasIndicator = contextRowEl.querySelector('.yapi-canvas-indicator');
  const fileIndicator = contextRowEl.querySelector('.yapi-file-indicator');
  const imagePreview = contextRowEl.querySelector('.yapi-image-preview');
  const hasEditorSelection = !!editorIndicator && !editorIndicator.hasClass('yapi-hidden');
  const hasBrowserSelection = !!browserIndicator && !browserIndicator.hasClass('yapi-hidden');
  const hasCanvasSelection = !!canvasIndicator && !canvasIndicator.hasClass('yapi-hidden');
  const hasFileChips = !!fileIndicator && fileIndicator.hasClass('yapi-visible-flex');
  const hasImageChips = !!imagePreview && imagePreview.hasClass('yapi-visible-flex');

  contextRowEl.classList.toggle(
    'has-content',
    hasEditorSelection
      || hasBrowserSelection
      || hasCanvasSelection
      || hasFileChips
      || hasImageChips
  );
}
