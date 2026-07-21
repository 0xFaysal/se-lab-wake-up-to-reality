# Week 01 Reflection — Minhajul Islam

## The Joel Test
Which of the 12 steps would most software teams in Bangladesh fail, and why?
From what I've seen in our local tech scene, most software teams in Bangladesh would struggle with the "quiet working conditions" and "fixing bugs before writing new code" steps. We often work in noisy, open-plan offices where deep focus is tough to maintain. Also, there's usually a lot of pressure from clients or management to push out new features fast, which means bug fixing often gets pushed to the backlog instead of zero-defect methodology.

## Most surprising from the Git workflows article
The most surprising thing was how structured the Gitflow Workflow is compared to what we usually do. It made me realize that while Feature Branching is great for smaller teams like ours, managing major releases with dedicated release and hotfix branches takes a whole different level of discipline.

## A DevSecOps concept that connects to something you already knew
The concept of "shifting left" in DevSecOps connects perfectly with what I know about catching errors early in React development. Just like it's easier and cheaper to fix a bug in the component logic before rendering the whole UI, it makes complete sense to integrate security checks early in the CI/CD pipeline rather than waiting for deployment.

## One genuine question you still have
In the Feature Branch Workflow, if multiple developers are working on different feature branches simultaneously and all need to be merged into `main` around the same time, what is the best strategy to handle the heavy merge conflicts that inevitably happen?