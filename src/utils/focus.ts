export function dismissSoftKeyboard() {
  const active = document.activeElement
  if (active instanceof HTMLElement) {
    active.blur()
  }
  window.getSelection()?.removeAllRanges()
}
