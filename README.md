================================================================================
                            gilWebSaver
================================================================================

## Project Overview
--------------------------------------------------------------------------------
gilWebSaver is a Chrome extension that allows you to save web pages in HTML format
to your local storage. Since URLs may disappear over time, this tool helps preserve
the actual content of web pages.

Version: 1.0
Manifest Version: 3


## Key Features
--------------------------------------------------------------------------------

### 1. Full Page Save
   - Save entire web pages as HTML files
   - Preserves complete web pages including CSS, images, and styles
   - Stable downloads with asynchronous save functionality

### 2. Selective Area Save
   - Save only specific areas of web pages
   - Preview elements on mouse hover (blue dashed border)
   - Click to select multiple areas (green solid border + checkmark badge)
   - Extract and save only selected areas as HTML

### 3. Enhanced Image Processing
   - Handle Base64 encoded images
   - Process and download external image URLs

### 4. Error Handling
   - Ignore third-party script errors (Drift, Intercom, Google Analytics, etc.)
   - Ignore framework errors (React, Vue, Next.js, etc.)
   - Block WebSocket-related errors


## Project Structure
--------------------------------------------------------------------------------

```
gilWebSaver/
│
├── manifest.json           # Chrome extension configuration file
│                          # - Permissions, metadata, entry points
│
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic and user interaction handling
│                          # - Full page save button
│                          # - Area selection mode toggle
│                          # - Save selection button
│                          # - Clear selection button
│
├── background.js          # Background service worker
│                          # - File download handling
│                          # - Side panel configuration
│
├── content.js             # Script injected into web pages
│                          # - Page content extraction and saving
│                          # - Area selection UI and interaction
│                          # - Image processing and Base64 conversion
│                          # - Third-party script error blocking
│
├── sidepanel.html         # Side panel UI
├── sidepanel.js           # Side panel logic
│                          # - Similar functionality to popup.js
│
├── panel.html             # Additional panel UI
└── panel.js               # Additional panel logic
```


## Permissions
--------------------------------------------------------------------------------
- **activeTab**: Access to the currently active tab
- **storage**: Local storage usage
- **downloads**: File downloads
- **tabs**: Access to tab information
- **scripting**: Script injection
- **windows**: Window management
- **sidePanel**: Side panel display
- **<all_urls>**: Access to all websites


## Installation & Usage
--------------------------------------------------------------------------------

### 1. Extension Installation
   - Open Chrome browser and navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select this project folder

### 2. Full Page Save
   - Click the extension icon on the web page you want to save
   - Click the "Save Full Page" button
   - HTML file will be saved to the downloads folder

### 3. Selective Area Save
   - Click the "Area Selection Mode" button (button turns orange)
   - Move mouse over desired area on the web page (blue border appears)
   - Click to select area (green border + checkmark badge appears)
   - Multiple areas can be selected
   - Click "Save Selection" button
   - Only selected areas will be saved as HTML

### 4. Clear Selection
   - Use "Clear Selection" button to deselect all selected areas


## Main Components
--------------------------------------------------------------------------------

### 1. background.js
   - `downloadFile()`: Handles file downloads and waits for completion
   - `waitForDownloadComplete()`: Monitors download status

### 2. popup.js / sidepanel.js
   - `ensureContentScriptLoaded()`: Checks and loads content.js
   - Event handlers for each button
   - Status message display (success/failure)

### 3. content.js (Main Features)
   - Selection mode management (`enableSelectMode` / `disableSelectMode`)
   - Element selection UI (hover, click handlers)
   - HTML content extraction (full/selection)
   - Image processing and Base64 conversion
   - Third-party script error blocking


## Tech Stack
--------------------------------------------------------------------------------
- Chrome Extension Manifest V3
- JavaScript (Vanilla)
- HTML5
- Chrome Extensions API
  - chrome.downloads
  - chrome.tabs
  - chrome.scripting
  - chrome.sidePanel
  - chrome.storage


## Recent Updates (Based on Git Log)
--------------------------------------------------------------------------------
1. Removed PDF conversion feature (failed feature)

2. Chrome extension - Improved async save functionality and enhanced image processing,
   Removed side panel pin button

3. Chrome extension - Added download handling and side panel configuration, UI improvements

4. Chrome extension - Save web pages as HTML locally.
   URLs may disappear, so saving actual content


## Notes
--------------------------------------------------------------------------------
- Some websites may not be saved perfectly due to Content Security Policy (CSP)
- Downloaded files are saved to the default downloads folder
- If a file with the same name exists, a number is automatically added (uniquify)


## Troubleshooting
--------------------------------------------------------------------------------
- **"Script load failed" error**: Refresh the page and try again
- **Selection mode not working**: Check if content.js is properly injected
- **Download failed**: Check Chrome's download permissions


## License
--------------------------------------------------------------------------------
This is a personal project.


================================================================================
Last Updated: 2025-11-16
================================================================================
