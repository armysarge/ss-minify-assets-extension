# Initialize and Push to GitHub

# Navigate to your extension directory
cd "c:\Users\Shaun\Desktop\minify-assets-extension"

# Initialize a Git repository
git init

# Add all the files to the repository
git add .

# Commit the files
git commit -m "Initial commit"

# Connect to your GitHub repository
git remote add origin https://github.com/armysarge/ss-minify-assets-extension.git

# Push your code to GitHub (use "main" instead of "master" if that's your default branch)
git push -u origin master

# If you need to create a token (Personal Access Token) for authentication:
# Visit: https://github.com/settings/tokens
# Then use the token in place of a password when pushing
