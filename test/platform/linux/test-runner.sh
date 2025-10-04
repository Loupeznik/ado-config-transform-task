#!/bin/bash

set -e

cd "$(dirname "$0")"

echo "Building Docker images for Linux testing..."
echo ""

echo "Building Node 20 image..."
docker build -t ado-task-linux-test -f Dockerfile .

echo ""
echo "Building Node 16 image..."
docker build -t ado-task-linux-test-node16 -f Dockerfile.node16 .

echo ""
echo "=========================================="
echo "Running task in Docker container with Node 20..."
echo "=========================================="
docker run --rm \
    -v "$(pwd)/../../../src/ConfigTransformTask/dist:/task/dist:ro" \
    -v "$(pwd)/../../../src/ConfigTransformTask/node_modules:/task/node_modules:ro" \
    -v "$(pwd)/../../../src/ConfigTransformTask/task.json:/task/task.json:ro" \
    -v "$(pwd)/test-task.sh:/test-task.sh:ro" \
    ado-task-linux-test \
    bash /test-task.sh

echo ""
echo "=========================================="
echo "Running task in Docker container with Node 16..."
echo "=========================================="
docker run --rm \
    -v "$(pwd)/../../../src/ConfigTransformTask/dist:/task/dist:ro" \
    -v "$(pwd)/../../../src/ConfigTransformTask/node_modules:/task/node_modules:ro" \
    -v "$(pwd)/../../../src/ConfigTransformTask/task.json:/task/task.json:ro" \
    -v "$(pwd)/test-task.sh:/test-task.sh:ro" \
    ado-task-linux-test-node16 \
    bash /test-task.sh

echo ""
echo "=========================================="
echo "All tests completed successfully!"
echo "=========================================="
