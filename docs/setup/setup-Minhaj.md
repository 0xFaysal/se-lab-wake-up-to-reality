# Setup Verification — Minhajul Islam
**Date:** July 17, 2026

## Output
HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "=============================="
==============================

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "UIU SE Lab — Setup Verification"
UIU SE Lab — Setup Verification

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "=============================="
==============================

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "1. Git:     $(git --version)"
1. Git:     git version 2.51.0.windows.2

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "2. Docker:  $(docker --version 2>/dev/null || echo 'NOT INSTALLED')"
2. Docker:  Docker version 29.6.1, build 8900f1d

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "3. Compose: $(docker compose version 2>/dev/null || echo 'NOT INSTALLED')"
3. Compose: Docker Compose version v5.2.0

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "4. Python:  $(python3 --version 2>/dev/null || python --version 2>/dev/null || echo 'NOT INSTALLED')"
4. Python:  Python 3.14.3

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ echo "5. Node:    $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
5. Node:    NOT INSTALLED

HP@HP-ProBook-450-G9 MINGW64 /c/Projects/SE Lab Project/se-lab-wake-up-to-reality (feature/Minhaj)
$ docker run --rm hello-world 2>&1 | grep -q "Hello from Docker" && echo "6. Docker: WORKING" || echo "6. Docker: FAILED"
6. Docker: FAILED

## Notes
I got stuck while running docker. I installed docker desktop and enabled WSL2. It still showing "Virtualization support not detected" while running docker. I will try to fix it later.