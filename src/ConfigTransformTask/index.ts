import tl = require('azure-pipelines-task-lib/task');
import { readFileSync, writeFileSync } from 'fs';

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
			default:
				throw new Error(`File type not supported: ${inputs.FileType}`);
		}
	} catch (err: any) {
		tl.setResult(tl.TaskResult.Failed, err.message as string);
	}
}

function transformJson(target: string, transformations: string) {
	let targetJson = JSON.parse(target);

	const transformedTarget = transformJsonInternal(targetJson, JSON.parse(transformations));

	targetJson = transformedTarget;

	return JSON.stringify(targetJson);
}

function transformJsonInternal(target: any, transformations: any) {
	Object.keys(transformations).forEach(transformKey => {
		const keys = transformKey.split('.');
		let currentTarget = target;

		for (let i = 0; i < keys.length; i++) {
			const key = keys[i];
			if (i === keys.length - 1) {
				currentTarget[key] = transformations[transformKey];
			} else {
				currentTarget[key] = currentTarget[key] || {};
				currentTarget = currentTarget[key];
			}
		}
	});

	return target;
}

run();
