import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("node:path");

const taskPath = path.join(__dirname, "..", "index.js");
const filePath = path.join(__dirname, "appsettings.xml");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("FileType", "xml");
tmr.setInput("TargetPath", filePath);
tmr.setInput("XmlTransformationMode", "object");
tmr.setInput(
	"Transformations",
	'{"configuration.appSettings.add.0.@value":"production","configuration.application.name":"Config Transform Task"}',
);

tmr.setAnswers({
	exist: {
		[filePath]: true,
	},
});

tmr.run();
