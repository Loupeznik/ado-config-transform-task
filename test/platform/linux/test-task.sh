#!/bin/bash

echo "=== Testing Azure DevOps Task on Linux ==="
echo ""

echo "Node version:"
node --version
echo ""

echo "Creating test config file..."
cat > /workspace/test-config.json << 'EOF'
{
  "app": {
    "name": "TestApp",
    "version": "1.0.0"
  },
  "database": {
    "host": "localhost",
    "port": 5432
  }
}
EOF

echo "Test config before transformation:"
cat /workspace/test-config.json
echo ""

echo "Setting up environment variables..."
export INPUT_TargetPath="/workspace/test-config.json"
export INPUT_FileType="json"
export INPUT_Transformations='{"app.name":"ProductionApp","app.version":"2.0.0","database.host":"prod-db.example.com"}'

echo "Running task..."
node /task/dist/index.js

echo ""
echo "Test config after transformation:"
cat /workspace/test-config.json
echo ""

if grep -q "ProductionApp" /workspace/test-config.json && grep -q "2.0.0" /workspace/test-config.json; then
    echo "✅ Task execution successful!"
    exit 0
else
    echo "❌ Task execution failed!"
    exit 1
fi
