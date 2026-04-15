import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("node:path");

const taskPath = path.join(__dirname, "..", "index.js");
const filePath = path.join(__dirname, "appsettings.xml");
const transformFilePath = path.join(__dirname, "appsettings.transform.config");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("FileType", "xml");
tmr.setInput("TargetPath", filePath);
tmr.setInput("XmlTransformationMode", "xdtFile");
tmr.setInput("XmlTransformationFilePath", transformFilePath);

tmr.setAnswers({
	exist: {
		[filePath]: true,
		[transformFilePath]: true,
	},
});

tmr.run();
