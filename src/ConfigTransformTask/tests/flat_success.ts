import tmrm = require('azure-pipelines-task-lib/mock-run');
import path = require('path');
import ma = require('azure-pipelines-task-lib/mock-answer');

const taskPath = path.join(__dirname, '..', 'index.js');
const filePath = path.join(__dirname, 'flat.txt');
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput('FileType', 'flat');
tmr.setInput('TargetPath', filePath);
tmr.setInput('Transformations', '{"ENV":"CHANGED","BASE_URL":"https://example.com","API_KEY":"ADDED_KEY_123"}');
tmr.setInput('Separator', '=');

tmr.setAnswers({
	exist: {
		[filePath]: true,
	},
});

tmr.run();
