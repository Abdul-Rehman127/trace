// Keyboard shortcuts for the simulator. Ignored while typing in a field.

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);
const ACTIVATES_ON_SPACE = new Set(['BUTTON', 'A', 'SUMMARY']);

function isTyping(el) {
  return !!el && (TYPING.has(el.tagName) || el.isContentEditable);
}

/**
 * @param {Record<string, () => void>} actions  toggle, back, forward, home, end, reset, slower, faster, theme
 * @param {HTMLElement} slider  the timeline position slider (handles its own arrow keys)
 */
export function bindKeys(actions, slider) {
  slider.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const map = {
      ArrowLeft: actions.back,
      ArrowDown: actions.back,
      ArrowRight: actions.forward,
      ArrowUp: actions.forward,
      Home: actions.home,
      End: actions.end,
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target;
    if (isTyping(target)) return;
    let fn = null;
    switch (e.key) {
      case ' ':
        // A focused button or link already acts on Space.
        if (target && ACTIVATES_ON_SPACE.has(target.tagName)) return;
        fn = actions.toggle;
        break;
      case 'ArrowLeft':
        fn = actions.back;
        break;
      case 'ArrowRight':
        fn = actions.forward;
        break;
      case 'Home':
        fn = actions.home;
        break;
      case 'End':
        fn = actions.end;
        break;
      case 'r':
      case 'R':
        fn = actions.reset;
        break;
      case '[':
        fn = actions.slower;
        break;
      case ']':
        fn = actions.faster;
        break;
      case 't':
      case 'T':
        fn = actions.theme;
        break;
      default:
        return;
    }
    e.preventDefault();
    fn();
  });
}
