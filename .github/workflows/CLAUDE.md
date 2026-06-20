# GitHub Workflows

## Responsibility

`.github/workflows/` owns GitHub Actions automation.

## Members

- `deploy.yml`: Builds the Vite app and deploys `dist/` to GitHub Pages.

## Boundaries

- Build commands must remain in `package.json`.
- Deploy artifacts must come from `dist/`.
