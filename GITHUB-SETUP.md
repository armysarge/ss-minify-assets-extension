# GitHub Repository Setup Instructions

These instructions will help you initialize your local repository and connect it to GitHub.

## Steps to initialize the repository and push to GitHub

1. **Navigate to your extension directory**:
   ```
   cd "c:\Users\Shaun\Desktop\minify-assets-extension"
   ```

2. **Initialize a Git repository**:
   ```
   git init
   ```

3. **Add all the files to the repository**:
   ```
   git add .
   ```

4. **Commit the files**:
   ```
   git commit -m "Initial commit"
   ```

5. **Connect to your GitHub repository** (assuming you've already created it at https://github.com/armysarge/ss-minify-assets-extension):
   ```
   git remote add origin https://github.com/armysarge/ss-minify-assets-extension.git
   ```

6. **Push your code to GitHub**:
   ```
   git push -u origin master
   ```

   If your default branch is called "main" instead of "master", use:
   ```
   git push -u origin main
   ```

## Alternative method: Create the repository on GitHub first

If you prefer to create the repository on GitHub first:

1. Go to https://github.com/new
2. Enter "ss-minify-assets-extension" as the repository name
3. Add a description (optional)
4. Choose whether to make it public or private
5. Do NOT initialize with a README, .gitignore, or license
6. Click "Create repository"
7. Follow the instructions shown on the resulting page for "…or push an existing repository from the command line"

## Creating a README.md for GitHub

You already have a README.md file in your extension folder that will be displayed on GitHub. If you want to make any changes specifically for GitHub, edit that file before pushing.
