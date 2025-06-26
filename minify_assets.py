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
        # Check if file is empty
        if os.path.getsize(file_path) == 0:
            print(f"Skipping empty file: {file_path}")
            return False

        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Skip if content is empty or just whitespace
        if not content or content.isspace():
            print(f"Skipping file with only whitespace: {file_path}")
            return False

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
        # Check if file is empty
        if os.path.getsize(file_path) == 0:
            print(f"Skipping empty file: {file_path}")
            return False

        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # Skip if content is empty or just whitespace
        if not content or content.isspace():
            print(f"Skipping file with only whitespace: {file_path}")
            return False

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

    print(f"Scanning {directory} and all subdirectories...")

    # Use recursive glob to find all CSS and JS files, including in subdirectories
    css_files = glob.glob(os.path.join(directory, '**', '*.css'), recursive=True)
    js_files = glob.glob(os.path.join(directory, '**', '*.js'), recursive=True)

    # Filter out already minified files
    css_files = [f for f in css_files if '.min.' not in f.lower()]
    js_files = [f for f in js_files if '.min.' not in f.lower()]

    # Count files per directory to show subdirectory processing
    directories = {}
    for file_path in css_files + js_files:
        dir_path = os.path.dirname(file_path)
        if dir_path in directories:
            directories[dir_path] += 1
        else:
            directories[dir_path] = 1

    # Show distribution of files across directories
    if len(directories) > 1:
        print(f"Files found across {len(directories)} directories:")
        for dir_path, count in directories.items():
            # Show relative path if possible for cleaner output
            try:
                rel_path = os.path.relpath(dir_path, directory)
                if rel_path == '.':
                    print(f"  - Root directory: {count} files")
                else:
                    print(f"  - {rel_path}: {count} files")
            except ValueError:
                # Fall back to absolute path if relpath fails
                print(f"  - {dir_path}: {count} files")

    total_files = len(css_files) + len(js_files)
    processed = 0
    success = 0

    print(f"Found {len(css_files)} CSS files and {len(js_files)} JavaScript files to process")

    css_success = 0
    js_success = 0

    for file_path in css_files:
        processed += 1
        print(f"[{processed}/{total_files}]", end=" ")
        if minify_css(file_path):
            success += 1
            css_success += 1

    for file_path in js_files:
        processed += 1
        print(f"[{processed}/{total_files}]", end=" ")
        if minify_js(file_path):
            success += 1
            js_success += 1

    print(f"\nProcessed {processed} files. Counted {success} successful minifications.")
    print(f"CSS: {css_success}/{len(css_files)}, JS: {js_success}/{len(js_files)}")

    # Get list of all minified files that might exist
    css_min_files = glob.glob(os.path.join(directory, '**', '*.min.css'), recursive=True)
    js_min_files = glob.glob(os.path.join(directory, '**', '*.min.js'), recursive=True)

    # Count only the minified files that correspond to the original files we processed
    # by checking if a minified version exists for each original file
    verified_css_success = 0
    verified_js_success = 0

    # Track files in nested directories for debugging
    nested_css_success = 0
    nested_js_success = 0
    root_dir = os.path.abspath(directory)

    for file_path in css_files:
        base = os.path.splitext(file_path)[0]
        min_path = f"{base}.min.css"
        if os.path.exists(min_path):
            verified_css_success += 1
            # Check if this is in a nested directory
            file_dir = os.path.dirname(os.path.abspath(file_path))
            if file_dir != root_dir:
                nested_css_success += 1

    for file_path in js_files:
        base = os.path.splitext(file_path)[0]
        min_path = f"{base}.min.js"
        if os.path.exists(min_path):
            verified_js_success += 1
            # Check if this is in a nested directory
            file_dir = os.path.dirname(os.path.abspath(file_path))
            if file_dir != root_dir:
                nested_js_success += 1

    verified_success = verified_css_success + verified_js_success

    # If there's a discrepancy between our counted successes and actual files found
    if verified_success != success:
        print(f"Note: Actually minified {verified_success} files ({verified_css_success} CSS, {verified_js_success} JS)")
        # Update the success count to the verified count for more accurate reporting
        success = verified_success

    # Report on nested directory processing
    total_nested = nested_css_success + nested_js_success
    if total_nested > 0:
        print(f"Successfully processed {total_nested} files in nested subdirectories ({nested_css_success} CSS, {nested_js_success} JS)")
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
