# Installing the Extension

## Local Installation

1. Make sure you have Node.js installed on your system
2. Open a terminal and navigate to the extension folder:
   ```
   cd "c:\Users\Shaun\Desktop\minify-assets-extension"
   ```

3. Install the VS Code Extension Manager if you don't have it already:
   ```
   npm install -g @vscode/vsce
   ```

4. Package the extension:
   ```
   vsce package
   ```
   
   (If you encounter a repository field error, you can use this command instead:)
   ```
   vsce package --allow-missing-repository
   ```

5. This will create a file named `ss-minify-assets-extension-0.0.1.vsix`

6. Install the extension in VS Code by either:
   - Dragging and dropping the .vsix file into VS Code
   - Running the command:
     ```
     code --install-extension ss-minify-assets-extension-0.0.1.vsix
     ```
   - Or through the VS Code UI:
     - Press F1 and select "Extensions: Install from VSIX..."
     - Navigate to and select the .vsix file

7. Restart VS Code

## Usage

After installation, you can:
- Right-click on any CSS or JS file and select "Minify CSS/JS"
- Right-click on any folder and select "Minify all CSS/JS in directory"

The extension will create minified versions with .min.css or .min.js extensions.
