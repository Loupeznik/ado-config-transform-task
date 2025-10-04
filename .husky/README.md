# Pre-commit Hooks

This directory contains Git hooks managed by Husky.

## Pre-commit Hook

The pre-commit hook runs automatically before each commit and performs:

1. **Biome Linting** - Checks code quality and style using Biome
2. **TypeScript Compilation** - Verifies TypeScript code compiles without errors

### How it works

When you run `git commit`, the pre-commit hook will:
- Navigate to `src/ConfigTransformTask`
- Run `npm run lint` to check code with Biome
- Run `npx tsc --noEmit` to type-check TypeScript (without generating files)

If any check fails, the commit will be aborted.

### Setup

After cloning the repository and running `npm install` in `src/ConfigTransformTask`, you need to install the git hooks once:

```bash
cd src/ConfigTransformTask
npx husky
```

This only needs to be done once per clone. The hooks will then run automatically on every commit.
