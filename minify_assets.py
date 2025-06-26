#!/usr/bin/env python
"""
CSS and JavaScript Minifier Script

This script minifies CSS and JavaScript files in a given path.
It uses csscompressor for CSS and jsmin for JavaScript minification.

Usage:
    python minify_assets.py [path]  - Path can be a directory or a specific file
"""

import os
import sys
import glob
from pathlib import Path

try:
    from csscompressor import compress as css_compress
except ImportError:
    print("csscompressor module not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "csscompressor"])
    from csscompressor import compress as css_compress

try:
    from jsmin import jsmin
except ImportError:
    print("jsmin module not found. Installing...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "jsmin"])
    from jsmin import jsmin


def minify_css(file_path):
    """Minify a CSS file and save with .min.css extension."""
    print(f"Minifying CSS: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        minified = css_compress(content)

        # Create output path with .min.css extension
        base = os.path.splitext(file_path)[0]
        output_path = f"{base}.min.css"

        with open(output_path, 'w', encoding='utf-8') as file:
            file.write(minified)

        original_size = os.path.getsize(file_path)
        minified_size = os.path.getsize(output_path)
        saved = original_size - minified_size
        saved_percent = (saved / original_size) * 100 if original_size > 0 else 0

        print(f"✓ Saved {saved_percent:.1f}% ({saved} bytes)")
        return True

    except Exception as e:
        print(f"Error minifying CSS file {file_path}: {str(e)}")
        return False


def minify_js(file_path):
    """Minify a JavaScript file and save with .min.js extension."""
    print(f"Minifying JS: {file_path}")
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        minified = jsmin(content)

        # Create output path with .min.js extension
        base = os.path.splitext(file_path)[0]
        output_path = f"{base}.min.js"

        with open(output_path, 'w', encoding='utf-8') as file:
            file.write(minified)

        original_size = os.path.getsize(file_path)
        minified_size = os.path.getsize(output_path)
        saved = original_size - minified_size
        saved_percent = (saved / original_size) * 100 if original_size > 0 else 0

        print(f"✓ Saved {saved_percent:.1f}% ({saved} bytes)")
        return True

    except Exception as e:
        print(f"Error minifying JavaScript file {file_path}: {str(e)}")
        return False


def process_file(file_path):
    """Process a single file based on its extension."""
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return False

    ext = os.path.splitext(file_path)[1].lower()

    # Skip already minified files
    if '.min.' in file_path.lower():
        return False

    if ext == '.css':
        return minify_css(file_path)
    elif ext == '.js':
        return minify_js(file_path)
    else:
        return False


def process_directory(directory):
    """Process all CSS and JS files in a directory and its subdirectories."""
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return False

    css_files = glob.glob(os.path.join(directory, '**', '*.css'), recursive=True)
    js_files = glob.glob(os.path.join(directory, '**', '*.js'), recursive=True)

    # Filter out already minified files
    css_files = [f for f in css_files if '.min.' not in f.lower()]
    js_files = [f for f in js_files if '.min.' not in f.lower()]

    total_files = len(css_files) + len(js_files)
    processed = 0
    success = 0

    print(f"Found {len(css_files)} CSS files and {len(js_files)} JavaScript files to process")

    for file_path in css_files:
        processed += 1
        print(f"[{processed}/{total_files}]", end=" ")
        if minify_css(file_path):
            success += 1

    for file_path in js_files:
        processed += 1
        print(f"[{processed}/{total_files}]", end=" ")
        if minify_js(file_path):
            success += 1

    print(f"\nProcessed {processed} files. Successfully minified {success} files.")
    return True


def main():
    """Main function to handle script execution."""
    if len(sys.argv) < 2:
        print("Please provide a file or directory path")
        print("Usage: python minify_assets.py [path]")
        return

    path = sys.argv[1]

    if os.path.isfile(path):
        process_file(path)
    elif os.path.isdir(path):
        process_directory(path)
    else:
        print(f"Invalid path: {path}")
        print("Please provide a valid file or directory path")


if __name__ == "__main__":
    main()
