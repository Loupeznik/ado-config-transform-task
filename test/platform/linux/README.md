# Linux Platform Tests

Docker-based tests to validate the Azure DevOps Config Transform Task on Linux systems with different Node.js versions.

## Prerequisites

- Docker installed and running
- Task must be built before running tests

## Build the Task

Before running tests, build the task from the project root:

```bash
cd src/ConfigTransformTask
npm install
npm run build
cd ../../
```

## Running Tests

From the project root directory:

```bash
test/platform/linux/test-runner.sh
```

Or from this directory:

```bash
cd test/platform/linux
./test-runner.sh
```

## What Gets Tested

The test suite validates:

1. **Node 20 compatibility** - Verifies the task works with Node 20.x (primary execution handler)
2. **Node 16 compatibility** - Verifies the task works with Node 16.x (fallback execution handler)
3. **JSON transformation** - Tests configuration file transformation functionality

## Test Environments

- **Node 20**: Ubuntu 22.04 with Node.js 20.x
- **Node 16**: Ubuntu 22.04 with Node.js 16.x

## Expected Output

```
Building Docker images for Linux testing...

Building Node 20 image...
Building Node 16 image...

==========================================
Running task in Docker container with Node 20...
==========================================
Node version: v20.x.x
✅ Task execution successful!

==========================================
Running task in Docker container with Node 16...
==========================================
Node version: v16.x.x
✅ Task execution successful!

==========================================
All tests completed successfully!
==========================================
```

## Troubleshooting

### Task not found errors
Ensure you've built the task first:
```bash
cd src/ConfigTransformTask && npm run build
```

### Docker permission errors
Run Docker commands with appropriate permissions or add your user to the docker group

### Port conflicts
Ensure no other containers are using conflicting ports
