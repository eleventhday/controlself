
import zipfile
import os

def zip_website(output_filename):
    files_to_zip = [
        'index.html',
        'app.js',
        'core/ctdp.js',
        'core/rsip.js',
        'styles/main.css',
        'README.md'
    ]
    
    with zipfile.ZipFile(output_filename, 'w') as zipf:
        for file in files_to_zip:
            if os.path.exists(file):
                zipf.write(file, arcname=file)
                print(f"Added {file}")
            else:
                print(f"Warning: {file} not found")

if __name__ == "__main__":
    zip_website('SelfControlProtocol.zip')
