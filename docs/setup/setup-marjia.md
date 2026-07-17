# Setup Verification — [Marjia Islam]
**Date:** July 16, 2026

## Output

UIU SE Lab — Setup Verification

1. Git:     git version 2.52.0.windows.1
2. Docker:  Docker version 29.6.1, build 8900f1d
3. Compose: Docker Compose version v5.3.0
4. Python:  Python 3.13.2
5. Node:    v24.11.1
6. Docker: WORKING

## output of [setup-check.sh](week-01/demo/setup-check.sh) file

  UIU SE Lab — Development Environment Check

[1] Core Tools
  ✅ Git: git version 2.52.0.windows.1
  ✅ Python: Python 3.13.2
  ✅ pip: pip 24.3.1 from C:\Users\MARZIA ISLAM\AppData\Local\Programs\Python\Python313\Lib\site-packages\pip (python 3.13)
  ✅ Node.js: v24.11.1
  ✅ npm: 11.6.2
  ✅ VS Code: 1.128.1

[2] Docker
  ✅ Docker: Docker version 29.6.1, build 8900f1d
  ✅ Docker Compose: Docker Compose version v5.3.0

[3] Docker Functional Test
  Running: docker run --rm hello-world ...
  ✅ Docker is working correctly

[4] Git Configuration
  ✅ Git name:  Marjia Islam
  ✅ Git email: marjia3035@gmail.com

[5] VS Code Extensions
  ✅ ms-python.python
  ✅ eamodio.gitlens
  ✅ ms-azuretools.vscode-docker

  Results: 14 passed | 0 failed

  🎉 All checks passed! You are ready for Lab 2.

## Notes
I didn't find any of the tools that difficult to install in particular but I faced with a problem when I run the given code snippet in git bash to check the setup verification, it was showing that Node.js is not installed even when it was! The problem was that a Git Bash alias (node='winpty node.exe') interfered with command substitution in the script. So, I removed the alias using "unalias node", which allowed the script to correctly detect Node.js.