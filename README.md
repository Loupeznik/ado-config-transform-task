# ADO Config Transform Task

This tool is useful for performing configuration transformations on multiple file types including JSON, XML, YAML and flat configuration files (like .env files).

## Manual testing

### PowerShell (Windows)

```powershell
cd src/ConfigTransformTask

$env:INPUT_TargetPath="C:\Dev\ADOConfigTransformTask\src\ConfigTransformTask\dist\flat.txt"
$env:INPUT_FileType="flat"
$env:INPUT_Transformations="{""ENV"":""CHANGED"",""BASE_URL"":""https://example.com"",""API_KEY"":""ADDED_KEY_123""}"
$env:INPUT_Separator="="

npm run build:dev
node dist/index.js

Get-Content -Path $env:INPUT_TargetPath
```

### Bash (Linux/macOS)

```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-config.txt"
export INPUT_FileType="flat"
export INPUT_Transformations='{"ENV":"CHANGED","BASE_URL":"https://example.com","API_KEY":"ADDED_KEY_123"}'
export INPUT_Separator="="

# Create a test file
echo -e "ENV=development\nBASE_URL=http://localhost:8080\nAPP_NAME=UnitTests" > test-config.txt

npm run build:dev
node dist/index.js

cat test-config.txt
```

### Additional Test Examples

#### JSON Configuration Test

**Bash:**
```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-app.json"
export INPUT_FileType="json"
export INPUT_Transformations='{"database.host":"production-server","app.version":"2.0.0"}'

# Create test JSON file
echo '{"database":{"host":"localhost","port":5432},"app":{"version":"1.0.0"}}' > test-app.json

npm run build:dev
node dist/index.js

cat test-app.json
```

**PowerShell:**
```powershell
cd src/ConfigTransformTask

$env:INPUT_TargetPath="$(Get-Location)\test-app.json"
$env:INPUT_FileType="json"
$env:INPUT_Transformations='{"database.host":"production-server","app.version":"2.0.0"}'

# Create test JSON file
'{"database":{"host":"localhost","port":5432},"app":{"version":"1.0.0"}}' | Out-File -FilePath test-app.json -Encoding utf8

npm run build:dev
node dist/index.js

Get-Content test-app.json
```

#### YAML Configuration Test

**Bash:**
```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-config.yaml"
export INPUT_FileType="yaml"
export INPUT_Transformations='{"database.host":"production-db","app.environment":"production"}'

# Create test YAML file
cat > test-config.yaml << EOF
database:
  host: localhost
  port: 5432
app:
  environment: development
  version: "1.0.0"
EOF

npm run build:dev
node dist/index.js

cat test-config.yaml
```

**PowerShell:**
```powershell
cd src/ConfigTransformTask

$env:INPUT_TargetPath="$(Get-Location)\test-config.yaml"
$env:INPUT_FileType="yaml"
$env:INPUT_Transformations='{"database.host":"production-db","app.environment":"production"}'

# Create test YAML file
@"
database:
  host: localhost
  port: 5432
app:
  environment: development
  version: "1.0.0"
"@ | Out-File -FilePath test-config.yaml -Encoding utf8

npm run build:dev
node dist/index.js

Get-Content test-config.yaml
```
