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
# Install dependencies
cd src/ConfigTransformTask
npm install

# Build TypeScript
npm run build

# Manual testing (set environment variables first)
cd src/ConfigTransformTask
tsc
node dist/index.js
```

### Manual Testing Environment Variables
```powershell
$env:INPUT_TargetPath="path/to/config/file"
$env:INPUT_FileType="json|yaml|flat"
$env:INPUT_Transformations='{"key":"value","nested.key":"newvalue"}'
$env:INPUT_Separator="=" # For flat files only
```

### Package Extension
```bash
# From src/ directory
tfx extension create --manifest-globs vss-extension.json
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
- Builds on push to master and PRs
- Creates VSIX package
- Publishes to marketplace on tagged releases (requires `PUBLISH_TOKEN` secret)
- Uses Node.js 20.x and TypeScript 4.6.3

## Testing Strategy

Tests are in `src/ConfigTransformTask/tests/` using Mocha with Azure DevOps task mock library. Currently, test script needs configuration (`npm test` exits with error).