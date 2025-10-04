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
- Run `npm run build` to compile TypeScript

If any check fails, the commit will be aborted.

### Setup

Hooks are automatically installed when you run `npm install` in `src/ConfigTransformTask` (via the `prepare` script).
