# Setup Verification — Minhajul Islam
**Date:** July 17, 2026

## Output

==============================
UIU SE Lab — Setup Verification
==============================
1. Git:     git version 2.51.0.windows.2
2. Docker:  Docker version 29.6.1, build 8900f1d
3. Compose: Docker Compose version v5.2.0
4. Python:  Python 3.14.3
5. Node:    NOT INSTALLED
6. Docker:  WORKING

## Notes
Issue: (i) Though node is installed it is showing as NOT INSTALLED in bash. 
(ii) I got stuck while running docker. I installed docker desktop and enabled WSL2. It still showing "Virtualization support not detected" while running docker. I will try to fix it later.

Solution: (i) Though I fixed the environment variables path of node. It is still showing as NOT INSTALLED in bash. 
(ii) I fixed the issue by enabling virtualization in BIOS. After that, I restarted my computer and ran docker again. It worked fine.