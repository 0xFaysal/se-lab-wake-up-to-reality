# Contributing Guide

## Branching Strategy (GitFlow)
- `main` → always deployable, branch-protected
- `develop` → integration branch (all features merge here)
- `feature/name` → create from develop, one feature per branch
- `hotfix/name` → urgent fixes, create from main

## Commit Message Convention (Conventional Commits)
- `feat(scope)`: add new feature
- `fix(scope)`: fix a bug
- `docs(scope)`: update documentation
- `test(scope)`: add or update tests
- `chore(scope)`: maintenance tasks
- `ci(scope)`: CI/CD changes
- `refactor(scope)`: code refactoring

## Pull Request Process
1. Create feature branch from `develop`
2. Make your changes + write tests
3. Push branch and open PR targeting `develop`
4. Write a clear PR description (what + why)
5. At least 1 teammate must approve
6. All CI/CD checks must pass
7. Merge and delete the branch

## Code Review Checklist
- [ ] Does it do what the PR description says?
- [ ] Are there tests for the new functionality?
- [ ] Any potential security issues?
- [ ] Is the code readable without excessive comments?
- [ ] Does it follow the project's code style?

## Getting Help
Open a GitHub Issue with label `blocked` and tag `@rejwanahmed007`
