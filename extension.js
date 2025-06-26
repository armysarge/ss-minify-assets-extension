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

            // Try different patterns to find success count
            let successMatches = result.match(/Minified (\d+) files/);
            if (!successMatches) {
                successMatches = result.match(/Counted (\d+) successful minifications/);
            }

            // Check CSS/JS specific counts as a fallback
            const cssSuccessMatches = result.match(/CSS: (\d+)\//);
            const jsSuccessMatches = result.match(/JS: (\d+)\//);

            const cssCount = cssMatches ? parseInt(cssMatches[1]) : 0;
            const jsCount = jsMatches ? parseInt(jsMatches[1]) : 0;

            let successCount = successMatches ? parseInt(successMatches[1]) : 0;

            // If we couldn't parse the success count from the main output, try to calculate it from components
            if (successCount === 0 && (cssSuccessMatches || jsSuccessMatches)) {
                const cssSuccess = cssSuccessMatches ? parseInt(cssSuccessMatches[1]) : 0;
                const jsSuccess = jsSuccessMatches ? parseInt(jsSuccessMatches[1]) : 0;
                successCount = cssSuccess + jsSuccess;
            }

            if (cssCount === 0 && jsCount === 0) {
                vscode.window.showInformationMessage(`No CSS or JS files found in ${path.basename(dirPath)}.`);
            } else {
                // Check for nested directory information
                const nestedMatches = result.match(/Successfully processed (\d+) files in nested subdirectories/);
                const nestedMessage = nestedMatches && parseInt(nestedMatches[1]) > 0
                    ? ` (including files in subdirectories)`
                    : '';

                vscode.window.showInformationMessage(
                    `Minified ${successCount} of ${cssCount + jsCount} files in ${path.basename(dirPath)}${nestedMessage}.`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error minifying directory: ${error.message}`);
        } finally {
            statusBarItem.dispose();
        }
    });

    // Register command to minify only CSS files in a directory
    let minifyDirCSSDisposable = vscode.commands.registerCommand('minify-assets.minifyDirectoryCSS', async (uri) => {
        if (!uri) {
            vscode.window.showWarningMessage('No directory selected.');
            return;
        }

        const dirPath = uri.fsPath;

        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = `$(sync~spin) Minifying CSS files in ${path.basename(dirPath)}...`;
        statusBarItem.show();

        try {
            // Create a modified version of the script to handle CSS only
            const tmpScriptPath = path.join(context.extensionPath, 'temp_css_only.py');

            // Read the original script
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');

            // Modify the process_directory function to only process CSS files
            const modifiedScript = scriptContent.replace(
                /js_files = glob\.glob\(os\.path\.join\(directory, '\*\*', '\*\.js'\), recursive=True\)/g,
                "js_files = []  # Skip JS files"
            );

            // Write the modified script
            fs.writeFileSync(tmpScriptPath, modifiedScript);

            const result = await runPythonScript(tmpScriptPath, dirPath, true);

            // Clean up temporary file
            fs.unlinkSync(tmpScriptPath);            // Extract statistics from the output
            const cssMatches = result.match(/Found (\d+) CSS files/);

            // Try different patterns to find success count
            let successMatches = result.match(/Actually minified (\d+) files/);
            if (!successMatches) {
                successMatches = result.match(/Counted (\d+) successful minifications/);
            }

            // Check CSS specific counts as a fallback
            const cssSuccessMatches = result.match(/CSS: (\d+)\//);

            const cssCount = cssMatches ? parseInt(cssMatches[1]) : 0;
            let successCount = successMatches ? parseInt(successMatches[1]) : 0;

            // If we couldn't parse the success count from the main output, try to get it from CSS count
            if (successCount === 0 && cssSuccessMatches) {
                successCount = parseInt(cssSuccessMatches[1]);
            }

            if (cssCount === 0) {
                vscode.window.showInformationMessage(`No CSS files found in ${path.basename(dirPath)}.`);
            } else {
                // Check for nested directory information
                const nestedMatches = result.match(/Successfully processed (\d+) files in nested subdirectories/);
                const nestedMessage = nestedMatches && parseInt(nestedMatches[1]) > 0
                    ? ` (including files in subdirectories)`
                    : '';

                vscode.window.showInformationMessage(
                    `Minified ${successCount} of ${cssCount} CSS files in ${path.basename(dirPath)}${nestedMessage}.`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error minifying CSS files: ${error.message}`);
        } finally {
            statusBarItem.dispose();
        }
    });

    // Register command to minify only JS files in a directory
    let minifyDirJSDisposable = vscode.commands.registerCommand('minify-assets.minifyDirectoryJS', async (uri) => {
        if (!uri) {
            vscode.window.showWarningMessage('No directory selected.');
            return;
        }

        const dirPath = uri.fsPath;

        const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        statusBarItem.text = `$(sync~spin) Minifying JS files in ${path.basename(dirPath)}...`;
        statusBarItem.show();

        try {
            // Create a modified version of the script to handle JS only
            const tmpScriptPath = path.join(context.extensionPath, 'temp_js_only.py');

            // Read the original script
            const scriptContent = fs.readFileSync(scriptPath, 'utf8');

            // Modify the process_directory function to only process JS files
            const modifiedScript = scriptContent.replace(
                /css_files = glob\.glob\(os\.path\.join\(directory, '\*\*', '\*\.css'\), recursive=True\)/g,
                "css_files = []  # Skip CSS files"
            );

            // Write the modified script
            fs.writeFileSync(tmpScriptPath, modifiedScript);

            const result = await runPythonScript(tmpScriptPath, dirPath, true);

            // Clean up temporary file
            fs.unlinkSync(tmpScriptPath);            // Extract statistics from the output
            const jsMatches = result.match(/Found (\d+) JavaScript files/);

            // Try different patterns to find success count
            let successMatches = result.match(/Actually minified (\d+) files/);
            if (!successMatches) {
                successMatches = result.match(/Counted (\d+) successful minifications/);
            }

            // Check JS specific counts as a fallback
            const jsSuccessMatches = result.match(/JS: (\d+)\//);

            const jsCount = jsMatches ? parseInt(jsMatches[1]) : 0;
            let successCount = successMatches ? parseInt(successMatches[1]) : 0;

            // If we couldn't parse the success count from the main output, try to get it from JS count
            if (successCount === 0 && jsSuccessMatches) {
                successCount = parseInt(jsSuccessMatches[1]);
            }

            if (jsCount === 0) {
                vscode.window.showInformationMessage(`No JavaScript files found in ${path.basename(dirPath)}.`);
            } else {
                // Check for nested directory information
                const nestedMatches = result.match(/Successfully processed (\d+) files in nested subdirectories/);
                const nestedMessage = nestedMatches && parseInt(nestedMatches[1]) > 0
                    ? ` (including files in subdirectories)`
                    : '';

                vscode.window.showInformationMessage(
                    `Minified ${successCount} of ${jsCount} JavaScript files in ${path.basename(dirPath)}${nestedMessage}.`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error minifying JavaScript files: ${error.message}`);
        } finally {
            statusBarItem.dispose();
        }
    });

    context.subscriptions.push(
        minifyFileDisposable,
        minifyDirDisposable,
        minifyDirCSSDisposable,
        minifyDirJSDisposable
    );
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
