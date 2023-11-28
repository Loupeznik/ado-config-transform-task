# Azure DevOps Config Transform Task

This tool is useful for performing configuration transformations on multiple file types including JSON, XML, YAML and flat configuration files (like .env files).

## Usage

There are three parameters that need to be set:

- `TargetFile` - The directory to write the transformed files to
- `FileType` - The type of file to transform. Currently supported are `json`, `xml`, `yaml` and `flat`
- `Transformations` - A list of transformations to perform. Transformations are defined as a JSON object, referencing keys and values to be
    replaced in the target file. The key indicates the JSON path to the desired key in the target file, the value is the value to be set.

### JSON and YAML transformation

For the following target file:

```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Information",
            "System": "Information",
            "Microsoft": "Information"
        }
    },
    "ConnectionStrings": {
        "Default": "Server=localhost;Port=5432;Database=myapp_local;User Id=admin;Password=admin;"
    },
    "AdminPassword": ""
}
```

```yaml
Logging:
  LogLevel:
    Default: Information
    System: Information
    Microsoft: Information
ConnectionStrings:
    Default: Server=localhost;Port=5432;Database=myapp_local;User Id=admin;Password=admin;
AdminPassword: ""
```



The following transformation:

```json
{
    "Logging.LogLevel.Default": "Error",
    "ConnectionStrings.Default": "Server=postgresql.database;Port=5432;Database=MyApp;User Id=admin;Password=SecretPa$$word;",
    "AdminPassword": "SuperSecretPa$$word"
}
```

The result in the target file will be:

```json
{
    "Logging": {
        "LogLevel": {
            "Default": "Error",
            "System": "Information",
            "Microsoft": "Information"
        }
    },
    "ConnectionStrings": {
        "Default": "Server=postgresql.database;Port=5432;Database=MyApp;User Id=admin;Password=SecretPa$$word;"
    },
    "AdminPassword": "SuperSecretPa$$word"
}
```

```yaml
Logging:
  LogLevel:
    Default: Error
    System: Information
    Microsoft: Information
ConnectionStrings:
    Default: Server=postgresql.database;Port=5432;Database=MyApp;User Id=admin;Password=SecretPa$$word;
AdminPassword: SuperSecretPa$$word
```
