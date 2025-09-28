import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('node:path');
import ma = require('azure-pipelines-task-lib/mock-answer');

const taskPath = path.join(__dirname, '..', 'index.js');
const filePath = path.join(__dirname, 'appsettings.json');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FileType', 'json');
tmr.setInput('TargetPath', filePath);
// Simulate the problematic input from classic pipelines with leading whitespace and newlines
tmr.setInput('Transformations', ' \n{\n  "InsuranceConfig.BuildVersion": "1.2.3.4"\n}\n ');

tmr.setAnswers({
	exist: {
		[filePath]: true,
	},
});

tmr.run();
