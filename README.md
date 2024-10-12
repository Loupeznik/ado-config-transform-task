# ADO Config Transform Task

This tool is useful for performing configuration transformations on multiple file types including JSON, XML, YAML and flat configuration files (like .env files).

## Manual testing

```powershell
cd src/ConfigTransformTask

$env:INPUT_TargetPath="C:\Dev\ADOConfigTransformTask\src\ConfigTransformTask\dist\flat.txt"
$env:INPUT_FileType="flat"
$env:INPUT_Transformations="{""ENV"":""CHANGED"",""BASE_URL"":""https://example.com"",""API_KEY"":""ADDED_KEY_123""}"
$env:INPUT_Separator="="

tsc
node dist/index.js

Get-Content -Path $env:INPUT_TargetPath
```
