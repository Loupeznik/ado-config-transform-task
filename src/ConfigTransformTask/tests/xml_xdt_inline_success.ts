import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("node:path");

const taskPath = path.join(__dirname, "..", "index.js");
const filePath = path.join(__dirname, "appsettings.xml");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("FileType", "xml");
tmr.setInput("TargetPath", filePath);
tmr.setInput("XmlTransformationMode", "xdtInline");
tmr.setInput(
	"Transformations",
	'<?xml version="1.0" encoding="utf-8"?><configuration xmlns:xdt="http://schemas.microsoft.com/XML-Document-Transform"><appSettings><add key="Environment" value="production" xdt:Locator="Match(key)" xdt:Transform="SetAttributes(value)" /><add key="Legacy" xdt:Locator="Match(key)" xdt:Transform="Remove" /></appSettings><connectionStrings><add name="Main" connectionString="Server=prod;" providerName="System.Data.SqlClient" xdt:Locator="Match(name)" xdt:Transform="Replace" /></connectionStrings></configuration>',
);

tmr.setAnswers({
	exist: {
		[filePath]: true,
	},
});

tmr.run();
