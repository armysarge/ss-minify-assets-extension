# SS Minify CSS & JS Extension

A Visual Studio Code extension that allows you to minify CSS and JavaScript files directly from the Explorer context menu.

## Features

- Right-click on CSS or JS files to minify them
- Right-click on folders to minify all CSS and JS files within (including in subdirectories)
- Saves minified versions with `.min.css` or `.min.js` extensions
- Shows minification statistics (size reduction)

## Requirements

- Python 3.x installed and accessible in your PATH
- The extension will automatically install required Python packages (`csscompressor` and `jsmin`) if needed

## How to Use

1. **Minify a Single File:**
   - Right-click on a CSS or JS file in the Explorer
   - Select "Minify CSS/JS" from the context menu
   - A minified version will be created with `.min.css` or `.min.js` extension

2. **Minify All Files in a Directory:**
   - Right-click on a directory in the Explorer
   - Select "Minify all CSS/JS in directory" from the context menu
   - All CSS and JS files in the directory (and subdirectories) will be minified

## Extension Settings

This extension does not contribute any settings yet.

## Known Issues

- None reported

## Release Notes

### 0.0.1

- Initial release
- Basic minification functionality for CSS and JS files
