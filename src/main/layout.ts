// Shared window-layout constants.
//
// TOP_BAR_HEIGHT is used both for sizing the target view in the main window
// (index.ts) and for positioning the console-preview window (consolePreview.ts).
// Keeping a single definition here prevents the two from silently drifting,
// which would misposition the preview relative to the main window's top bar.

export const TOP_BAR_HEIGHT = 52
