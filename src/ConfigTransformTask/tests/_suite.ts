import * as assert from "node:assert/strict";
import fs from "node:fs/promises";
import * as path from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import transformJson from "../transformations/json";
import transformXml from "../transformations/xml";

type TaskTestFile = {
	name: string;
	content: string;
};

describe("ConfigTransformTask tests", () => {
	before(() => {
		process.env.TASK_TEST_NODE_VERSION = "20";
	});

	after(() => {
		delete process.env.TASK_TEST_NODE_VERSION;
	});

	it("json transformation should succeed", async () => {
		await runTaskTest({
			scriptName: "json_success.js",
			targetFileName: "appsettings.json",
			targetContent: `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`,
			assertFile: async filePath => {
				const parsedContent = JSON.parse(await fs.readFile(filePath, "utf8"));
				assert.equal(parsedContent.InsuranceConfig.BuildVersion, "1.2.3.4");
			},
		});
	});

	it("json transformation with whitespace should succeed", async () => {
		await runTaskTest({
			scriptName: "json_whitespace.js",
			targetFileName: "appsettings.json",
			targetContent: `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`,
			assertFile: async filePath => {
				const parsedContent = JSON.parse(await fs.readFile(filePath, "utf8"));
				assert.equal(parsedContent.InsuranceConfig.BuildVersion, "1.2.3.4");
			},
		});
	});

	it("json transformation with BOM should succeed", async () => {
		await runTaskTest({
			scriptName: "json_bom.js",
			targetFileName: "appsettings.json",
			targetContent: `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`,
			assertFile: async filePath => {
				const parsedContent = JSON.parse(await fs.readFile(filePath, "utf8"));
				assert.equal(parsedContent.InsuranceConfig.BuildVersion, "1.2.3.4");
			},
		});
	});

	it("json transformation should support array paths", () => {
		const result = transformJson(
			'{"services":[{"name":"api","port":80}]}',
			'{"services.0.port":443,"services.1.name":"worker","services.1.port":8080}',
		);

		assert.deepEqual(JSON.parse(result), {
			services: [
				{ name: "api", port: 443 },
				{ name: "worker", port: 8080 },
			],
		});
	});

	it("json transformation should reject invalid array indexes", () => {
		assert.throws(
			() => transformJson('{"services":[{"name":"api"}]}', '{"services.-1.name":"broken"}'),
			/Invalid array index/,
		);
		assert.throws(
			() => transformJson('{"services":[{"name":"api"}]}', '{"services.one.name":"broken"}'),
			/Invalid array index/,
		);
	});

	it("json transformation should allow sparse array growth", () => {
		const result = transformJson(
			'{"services":[{"name":"api"}]}',
			'{"services.5.name":"worker","services.5.port":8080}',
		);

		const parsedResult = JSON.parse(result);
		assert.equal(parsedResult.services[5].name, "worker");
		assert.equal(parsedResult.services[5].port, 8080);
	});

	it("flat file transformation should succeed", async () => {
		await runTaskTest({
			scriptName: "flat_success.js",
			targetFileName: "flat.txt",
			targetContent: `ENV=development
BASE_URL=http://localhost:8080
APP_NAME=UnitTests`,
			assertFile: async filePath => {
				const fileContent = await fs.readFile(filePath, "utf8");
				assert.equal(fileContent.includes("ENV=CHANGED"), true);
				assert.equal(fileContent.includes("BASE_URL=https://example.com"), true);
				assert.equal(fileContent.includes("API_KEY=ADDED_KEY_123"), true);
				assert.equal(fileContent.includes("APP_NAME=UnitTests"), true);
			},
		});
	});

	it("xml object transformation should update attributes and element text", () => {
		const result = transformXml(
			`<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
  <application>
    <name>Legacy App</name>
  </application>
</configuration>`,
			'{"configuration.appSettings.add.0.@value":"production","configuration.application.name":"Modern App"}',
			"object",
		);

		assert.equal(
			getElementAttributeValue(result, "add", "key", "Environment", "value"),
			"production",
		);
		assert.equal(getSingleElementText(result, "name"), "Modern App");
		assert.equal(result.startsWith('<?xml version="1.0" encoding="utf-8"?>'), true);
	});

	it("xml object transformation should surface JSON parse errors", () => {
		assert.throws(
			() =>
				transformXml(
					"<configuration><value>1</value></configuration>",
					"{invalid",
					"object",
				),
			/Failed to parse transformations JSON/,
		);
	});

	it("xml XDT transformation should support common transforms", () => {
		const result = transformXml(
			`<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" enabled="true" />
    <add key="Legacy" value="remove-me" />
    <add key="Duplicate" value="first" />
    <add key="Duplicate" value="second" />
  </appSettings>
  <connectionStrings>
    <add name="Main" connectionString="Server=localhost;" providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>`,
			`<?xml version="1.0" encoding="utf-8"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings>
    <add key="Environment" value="production" xdt:Locator="Match(key)" xdt:Transform="SetAttributes(value)" />
    <add key="Environment" xdt:Locator="Match(key)" xdt:Transform="RemoveAttributes(enabled)" />
    <add key="Legacy" xdt:Locator="Match(key)" xdt:Transform="Remove" />
    <add key="Duplicate" xdt:Locator="Match(key)" xdt:Transform="RemoveAll" />
    <add key="Inserted" value="from-insert" xdt:Transform="Insert" />
    <add key="Optional" value="from-insert-if-missing" xdt:Locator="Match(key)" xdt:Transform="InsertIfMissing" />
  </appSettings>
  <connectionStrings>
    <add name="Main" connectionString="Server=prod;" providerName="System.Data.SqlClient" xdt:Locator="Match(name)" xdt:Transform="Replace" />
  </connectionStrings>
</configuration>`,
			"xdtInline",
		);

		assert.equal(
			getElementAttributeValue(result, "add", "key", "Environment", "value"),
			"production",
		);
		assert.equal(
			getElementAttributeValue(result, "add", "key", "Environment", "enabled"),
			null,
		);
		assert.equal(findElementsByAttribute(result, "add", "key", "Legacy").length, 0);
		assert.equal(findElementsByAttribute(result, "add", "key", "Duplicate").length, 0);
		assert.equal(
			getElementAttributeValue(result, "add", "key", "Inserted", "value"),
			"from-insert",
		);
		assert.equal(
			getElementAttributeValue(result, "add", "key", "Optional", "value"),
			"from-insert-if-missing",
		);
		assert.equal(
			getElementAttributeValue(result, "add", "name", "Main", "connectionString"),
			"Server=prod;",
		);
		assert.equal(result.includes("xmlns:xdt"), false);
		assert.equal(result.includes("xdt:Transform"), false);
	});

	it("xml XDT transformation should reject unsupported locators", () => {
		assert.throws(
			() =>
				transformXml(
					"<configuration><appSettings><add key=\"Environment\" value=\"dev\" /></appSettings></configuration>",
					"<configuration xmlns:xdt=\"http://schemas.microsoft.com/XML-Document-Transform\"><appSettings><add key=\"Environment\" value=\"prod\" xdt:Locator=\"Condition(@key='Environment')\" xdt:Transform=\"SetAttributes(value)\" /></appSettings></configuration>",
					"xdtInline",
				),
			/Unsupported XDT locator/,
		);
	});

	it("xml object task transformation should succeed", async () => {
		await runTaskTest({
			scriptName: "xml_object_success.js",
			targetFileName: "appsettings.xml",
			targetContent: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
  <application>
    <name>Legacy App</name>
  </application>
</configuration>`,
			assertFile: async filePath => {
				const xml = await fs.readFile(filePath, "utf8");
				assert.equal(
					getElementAttributeValue(xml, "add", "key", "Environment", "value"),
					"production",
				);
				assert.equal(getSingleElementText(xml, "name"), "Config Transform Task");
			},
		});
	});

	it("xml inline XDT task transformation should succeed", async () => {
		await runTaskTest({
			scriptName: "xml_xdt_inline_success.js",
			targetFileName: "appsettings.xml",
			targetContent: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
    <add key="Legacy" value="remove-me" />
  </appSettings>
  <connectionStrings>
    <add name="Main" connectionString="Server=localhost;" providerName="System.Data.SqlClient" />
  </connectionStrings>
</configuration>`,
			assertFile: async filePath => {
				const xml = await fs.readFile(filePath, "utf8");
				assert.equal(
					getElementAttributeValue(xml, "add", "key", "Environment", "value"),
					"production",
				);
				assert.equal(findElementsByAttribute(xml, "add", "key", "Legacy").length, 0);
				assert.equal(
					getElementAttributeValue(xml, "add", "name", "Main", "connectionString"),
					"Server=prod;",
				);
			},
		});
	});

	it("xml external XDT task transformation should succeed", async () => {
		await runTaskTest({
			scriptName: "xml_xdt_file_success.js",
			targetFileName: "appsettings.xml",
			targetContent: `<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <appSettings>
    <add key="Environment" value="development" />
  </appSettings>
</configuration>`,
			additionalFiles: [
				{
					name: "appsettings.transform.config",
					content: `<?xml version="1.0" encoding="utf-8"?>
<configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform">
  <appSettings>
    <add key="Environment" value="production" xdt:Locator="Match(key)" xdt:Transform="SetAttributes(value)" />
    <add key="FeatureFlag" value="enabled" xdt:Transform="Insert" />
  </appSettings>
</configuration>`,
				},
			],
			assertFile: async filePath => {
				const xml = await fs.readFile(filePath, "utf8");
				assert.equal(
					getElementAttributeValue(xml, "add", "key", "Environment", "value"),
					"production",
				);
				assert.equal(
					getElementAttributeValue(xml, "add", "key", "FeatureFlag", "value"),
					"enabled",
				);
			},
		});
	});
});

async function runTaskTest({
	scriptName,
	targetFileName,
	targetContent,
	assertFile,
	additionalFiles = [],
}: {
	scriptName: string;
	targetFileName: string;
	targetContent: string;
	assertFile: (filePath: string) => Promise<void>;
	additionalFiles?: TaskTestFile[];
}) {
	const runner = new ttm.MockTestRunner(path.join(__dirname, scriptName));
	const files = [{ name: targetFileName, content: targetContent }, ...additionalFiles];

	try {
		for (const file of files) {
			await fs.writeFile(path.join(__dirname, file.name), file.content);
		}

		await runner.runAsync(20);

		assert.equal(runner.succeeded, true, "task should succeed");
		assert.equal(runner.warningIssues.length, 0, "task should not emit warnings");
		assert.equal(runner.errorIssues.length, 0, "task should not emit errors");

		await assertFile(path.join(__dirname, targetFileName));
	} finally {
		await Promise.all(
			files.map(async file => {
				await fs.rm(path.join(__dirname, file.name), { force: true });
			}),
		);
	}
}

function parseXml(xml: string) {
	return new DOMParser().parseFromString(xml, "text/xml");
}

function findElementsByAttribute(
	xml: string,
	tagName: string,
	attributeName: string,
	attributeValue: string,
) {
	const document = parseXml(xml);
	return Array.from(document.getElementsByTagName(tagName)).filter(
		element => element.getAttribute(attributeName) === attributeValue,
	);
}

function getElementAttributeValue(
	xml: string,
	tagName: string,
	matchAttributeName: string,
	matchAttributeValue: string,
	targetAttributeName: string,
) {
	const matchingElement = findElementsByAttribute(
		xml,
		tagName,
		matchAttributeName,
		matchAttributeValue,
	)[0];

	return matchingElement?.getAttribute(targetAttributeName) ?? null;
}

function getSingleElementText(xml: string, tagName: string) {
	const document = parseXml(xml);
	return document.getElementsByTagName(tagName)[0]?.textContent ?? null;
}
