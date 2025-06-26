const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Get the path to the Python script
    const extensionPath = context.extensionPath;
    const scriptPath = path.join(extensionPath, 'minify_assets.py');

    // Copy the script to the extension directory if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
        const userScriptPath = path.join(vscode.env.appRoot, '..', '..', 'Desktop', 'minify_assets.py');
        if (fs.existsSync(userScriptPath)) {
            fs.copyFileSync(userScriptPath, scriptPath);
        } else {
            vscode.window.showErrorMessage('Could not find minify_assets.py script. Please ensure it exists in your Desktop folder.');
            return;
        }
    }

    // Register command to minify a single file
    let minifyFileDisposable = vscode.commands.registerCommand('minify-assets.minifyFile', async (uri) => {
        if (!uri) {
            // If command was triggered from command palette, get the active file
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                uri = editor.document.uri;
            } else {
                vscode.window.showWarningMessage('No file selected.');
                return;
            }
        }

        const filePath = uri.fsPath;
        const ext = path.extname(filePath).toLowerCase();

        if (ext !== '.css' && ext !== '.js') {
            vscode.window.showWarningMessage('Selected file is not a CSS or JS file.');
            return;
        }

        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = `$(sync~spin) Minifying ${path.basename(filePath)}...`;
        statusBarItem.show();

        try {
            await runPythonScript(scriptPath, filePath);
            const baseName = path.basename(filePath);
            const baseNameWithoutExt = path.basename(filePath, ext);
            const minifiedPath = path.join(path.dirname(filePath), `${baseNameWithoutExt}.min${ext}`);

            if (fs.existsSync(minifiedPath)) {
                const originalSize = fs.statSync(filePath).size;
                const minifiedSize = fs.statSync(minifiedPath).size;
                const savedPercent = ((originalSize - minifiedSize) / originalSize * 100).toFixed(1);

                vscode.window.showInformationMessage(
                    `Successfully minified ${baseName}. Saved ${savedPercent}% (${originalSize - minifiedSize} bytes).`
                );
            } else {
                vscode.window.showWarningMessage(`Failed to minify ${baseName}. Minified file not found.`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error minifying file: ${error.message}`);
        } finally {
            statusBarItem.dispose();
        }
    });

    // Register command to minify all CSS/JS files in a directory
    let minifyDirDisposable = vscode.commands.registerCommand('minify-assets.minifyDirectory', async (uri) => {
        if (!uri) {
            vscode.window.showWarningMessage('No directory selected.');
            return;
        }

        const dirPath = uri.fsPath;

        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = `$(sync~spin) Minifying CSS/JS files in ${path.basename(dirPath)}...`;
        statusBarItem.show();

        try {
            const result = await runPythonScript(scriptPath, dirPath, true);

            // Extract statistics from the output
            const cssMatches = result.match(/Found (\d+) CSS files/);
            const jsMatches = result.match(/Found (\d+) JavaScript files/);
            const successMatches = result.match(/Successfully minified (\d+) files/);

            const cssCount = cssMatches ? parseInt(cssMatches[1]) : 0;
            const jsCount = jsMatches ? parseInt(jsMatches[1]) : 0;
            const successCount = successMatches ? parseInt(successMatches[1]) : 0;

            if (cssCount === 0 && jsCount === 0) {
                vscode.window.showInformationMessage(`No CSS or JS files found in ${path.basename(dirPath)}.`);
            } else {
                vscode.window.showInformationMessage(
                    `Minified ${successCount} of ${cssCount + jsCount} files in ${path.basename(dirPath)}.`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error minifying directory: ${error.message}`);
        } finally {
            statusBarItem.dispose();
        }
    });

    context.subscriptions.push(minifyFileDisposable, minifyDirDisposable);
}

/**
 * Run the Python script with the given path
 * @param {string} scriptPath - Path to the Python script
 * @param {string} targetPath - Path to the file or directory to minify
 * @param {boolean} captureOutput - Whether to capture and return the output
 * @returns {Promise<string>} - The output of the script if captureOutput is true
 */
function runPythonScript(scriptPath, targetPath, captureOutput = false) {
    return new Promise((resolve, reject) => {
        const pythonCommand = 'python';
        const command = `${pythonCommand} "${scriptPath}" "${targetPath}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(new Error(`${error.message}\n${stderr}`));
                return;
            }

            if (captureOutput) {
                resolve(stdout);
            } else {
                resolve();
            }
        });
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
