import tl = require('azure-pipelines-task-lib/task');
import { readFileSync, writeFileSync } from 'fs';
import transformJson from './transformations/json';
import transformYaml from './transformations/yaml';

type Inputs = {
	FileType: 'json' | 'xml' | 'yaml';
	TargetPath: string;
	Transformations: string;
};

async function run() {
	try {
		const inputs: Inputs = {
			FileType: tl.getInput('FileType', true) as 'json' | 'xml' | 'yaml',
			TargetPath: tl.getInput('TargetPath', true) as string,
			Transformations: tl.getInput('Transformations', true) as string,
		};

		if (!tl.exist(inputs.TargetPath)) {
			throw new Error(`File not found: ${inputs.TargetPath}`);
		}

		switch (inputs.FileType) {
			case 'json':
				const targetJson = readFileSync(inputs.TargetPath, 'utf8');
				const resultJson = transformJson(targetJson, inputs.Transformations);
				writeFileSync(inputs.TargetPath, resultJson);
				break;
			case 'yaml':
				const targetYaml = readFileSync(inputs.TargetPath, 'utf8');
				const resultYaml = transformYaml(targetYaml, inputs.Transformations);
				writeFileSync(inputs.TargetPath, resultYaml);
				break;
			default:
				throw new Error(`File type not supported: ${inputs.FileType}`);
		}

		tl.setResult(tl.TaskResult.Succeeded, `Transformed ${inputs.TargetPath}`);
	} catch (err: any) {
		tl.setResult(tl.TaskResult.Failed, `An error has occured during transformation - ${err.message as string}`);
	}
}

run();
