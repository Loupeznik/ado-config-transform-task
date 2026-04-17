# ADO Config Transform Task

This tool is useful for performing configuration transformations on JSON, XML, YAML, and flat configuration files (like `.env` files).

## Development Setup

After cloning the repository:

```bash
cd src/ConfigTransformTask
npm install

# Install git hooks (pre-commit checks)
npx husky
```

The pre-commit hooks will automatically run biome linting and TypeScript type checking before each commit.

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

#### XML Configuration Test (inline object mode)

**Bash:**
```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-config.xml"
export INPUT_FileType="xml"
export INPUT_XmlTransformationMode="object"
export INPUT_Transformations='{"configuration.appSettings.add.0.@value":"production","configuration.application.name":"Config Transform Task"}'

cat > test-config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
  <application>
    <name>Legacy App</name>
  </application>
</configuration>
EOF

npm run build:dev
node dist/index.js

cat test-config.xml
```

**PowerShell:**
```powershell
cd src/ConfigTransformTask

$env:INPUT_TargetPath="$(Get-Location)\test-config.xml"
$env:INPUT_FileType="xml"
$env:INPUT_XmlTransformationMode="object"
$env:INPUT_Transformations='{"configuration.appSettings.add.0.@value":"production","configuration.application.name":"Config Transform Task"}'

@"
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
  <application>
    <name>Legacy App</name>
  </application>
</configuration>
"@ | Out-File -FilePath test-config.xml -Encoding utf8

npm run build:dev
node dist/index.js

Get-Content test-config.xml
```

#### XML Configuration Test (inline XDT mode)

**Bash:**
```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-config.xml"
export INPUT_FileType="xml"
export INPUT_XmlTransformationMode="xdtInline"
export INPUT_Transformations='<?xml version="1.0" encoding="utf-8"?><configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform"><appSettings><add key="Environment" value="production" xdt:Locator="Match(key)" xdt:Transform="SetAttributes(value)" /><add key="FeatureFlag" value="enabled" xdt:Transform="Insert" /></appSettings></configuration>'

cat > test-config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
</configuration>
EOF

npm run build:dev
node dist/index.js

cat test-config.xml
```

#### XML Configuration Test (external XDT file)

**Bash:**
```bash
cd src/ConfigTransformTask

export INPUT_TargetPath="$(pwd)/test-config.xml"
export INPUT_FileType="xml"
export INPUT_XmlTransformationMode="xdtFile"
export INPUT_XmlTransformationFilePath="$(pwd)/test-config.transform.config"

cat > test-config.xml << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
</configuration>
EOF

cat > test-config.transform.config << EOF
<?xml version="1.0" encoding="utf-8"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings>
    <add key="Environment" value="production" xdt:Locator="Match(key)" xdt:Transform="SetAttributes(value)" />
    <add key="FeatureFlag" value="enabled" xdt:Transform="Insert" />
  </appSettings>
</configuration>
EOF

npm run build:dev
node dist/index.js

cat test-config.xml
```
