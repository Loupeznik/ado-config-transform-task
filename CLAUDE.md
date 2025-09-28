# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Azure DevOps configuration transformation task that transforms JSON, YAML, and flat configuration files. The task is packaged as a VSIX extension for deployment to the Azure DevOps marketplace.

## Architecture

The project follows a modular architecture:

- **Main orchestrator**: `src/ConfigTransformTask/index.ts` - Routes file type processing and handles Azure DevOps task integration
- **Transformation modules**: `src/ConfigTransformTask/transformations/` - Type-specific transformation logic for json, yaml, and flat files
- **File validation**: `src/ConfigTransformTask/helpers/fileHelpers.ts` - File existence and format validation
- **Task definition**: `src/ConfigTransformTask/task.json` - Azure DevOps task inputs and metadata
- **Extension manifest**: `src/vss-extension.json` - Azure DevOps marketplace extension configuration

Each transformation module follows the same pattern: accepts file content and transformation JSON, returns transformed content.

## Development Commands

### Build and Test
```bash
cd src/ConfigTransformTask

# Development build (includes dev dependencies)
npm run build:dev

# Production build (runtime dependencies only)
npm run build:prod

# Complete VSIX build
npm run build:vsix

# Run tests
npm test

# Linting and formatting
npm run lint
npm run format
```

### Manual Testing Environment Variables

**PowerShell (Windows):**
```powershell
$env:INPUT_TargetPath="path/to/config/file"
$env:INPUT_FileType="json|yaml|flat"
$env:INPUT_Transformations='{"key":"value","nested.key":"newvalue"}'
$env:INPUT_Separator="=" # For flat files only
```

**Bash (Linux/macOS):**
```bash
export INPUT_TargetPath="path/to/config/file"
export INPUT_FileType="json|yaml|flat"
export INPUT_Transformations='{"key":"value","nested.key":"newvalue"}'
export INPUT_Separator="=" # For flat files only
```

### Package Extension
```bash
# Recommended: Use build script (handles everything)
cd src/ConfigTransformTask && npm run build:vsix

# Manual: From src/ directory
cd src && tfx extension create --manifest-globs vss-extension.json
```

## Key Dependencies

- `azure-pipelines-task-lib`: Azure DevOps task integration
- `js-yaml`: YAML parsing and serialization
- TypeScript 4.6.3 for compilation
- `tfx-cli` for VSIX packaging

## File Type Support

- **JSON**: Uses native JavaScript JSON parsing, supports nested object transformations via dot notation
- **YAML**: Uses js-yaml library, preserves structure and formatting
- **Flat files**: Supports `=` and `:` separators, handles key-value pairs and additions
- **XML**: Type defined in task.json but not yet implemented

## Transformation Format

All transformations use JSON format with dot notation for nested keys:
```json
{
  "topLevel": "newValue",
  "nested.key": "newNestedValue",
  "array.0.property": "newArrayValue"
}
```

## CI/CD

GitHub Actions workflow in `.github/workflows/build.yml`:
- Runs linting and tests first
- Builds production package with runtime dependencies only
- Creates VSIX package
- Publishes to marketplace on tagged releases (requires `PUBLISH_TOKEN` secret)
- Uses Node.js 20.x and Node20_1 runner

## Testing Strategy

Tests are in `src/ConfigTransformTask/tests/` using Mocha with Azure DevOps task mock library.

**Note:** Automated tests currently have Node.js version compatibility issues (trying to download Node 16 instead of using current Node 20+). Manual testing is recommended instead.

### Manual Testing Commands

**JSON Test:**
```bash
cd src/ConfigTransformTask
export INPUT_TargetPath="$(pwd)/test.json"
export INPUT_FileType="json"
export INPUT_Transformations='{"app.version":"2.0.0","database.host":"production"}'
echo '{"app":{"version":"1.0.0"},"database":{"host":"localhost"}}' > test.json
npm run build && node dist/index.js && cat test.json
```

**YAML Test:**
```bash
cd src/ConfigTransformTask
export INPUT_TargetPath="$(pwd)/test.yaml"
export INPUT_FileType="yaml"
export INPUT_Transformations='{"app.environment":"production"}'
echo -e "app:\n  environment: development" > test.yaml
npm run build && node dist/index.js && cat test.yaml
```

**Flat File Test:**
```bash
cd src/ConfigTransformTask
export INPUT_TargetPath="$(pwd)/test.env"
export INPUT_FileType="flat"
export INPUT_Transformations='{"ENV":"production","NEW_VAR":"added"}'
export INPUT_Separator="="
echo -e "ENV=development\nEXISTING=value" > test.env
npm run build && node dist/index.js && cat test.env
```