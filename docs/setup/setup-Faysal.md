# Setup Verification — Faysal Ahmed Fahim
**Date:** July 18, 2026

## Output

==============================
UIU SE Lab — Setup Verification
==============================
1. Git:     git version 2.45.1.windows.1
2. Docker:  Docker version 28.1.1, build 4eba377
3. Compose: Docker Compose version v2.36.0-desktop.1
4. Python:  Python 3.14.6
5. Node:    v24.11.1
6. Docker: WORKING

## Notes
All required development tools were already installed because I had used them in previous software development work.

I faced a problem when I tried to create the repository using a fork. I was unable to make the fork private and I was also unable to add my teammates. Because of that, I created a new private repository and used that instead.

New repository created: `se-lab-wake-up-to-reality` (private)

## Repository Setup Steps

1. Create a new private repository named `se-lab-wake-up-to-reality`.
2. Initialize the local project and connect it to the new private repository.

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/0xFaysal/se-lab-wake-up-to-reality.git
git push -u origin main
```

3. Copy the code, branches, and commit history from the old public fork into the new private repository.

```bash
git clone --bare https://github.com/rejwanahmed007/se-lab-wake-up-to-reality.git
cd se-lab-wake-up-to-reality.git
git push --mirror https://github.com/0xFaysal/se-lab-wake-up-to-reality.git
```

4. Remove the temporary bare clone after the mirror push is finished.

```bash
cd ..
rmdir /s /q se-lab-wake-up-to-reality.git
```

After that, I refreshed GitHub and confirmed that the private repository was ready to use.