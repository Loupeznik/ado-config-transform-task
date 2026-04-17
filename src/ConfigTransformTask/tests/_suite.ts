import * as assert from 'node:assert';
import fs from 'node:fs';
import * as path from 'node:path';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import { checkFileValidity } from '../helpers/fileHelpers';
import transformFlatFile from '../transformations/flat';
import transformYaml from '../transformations/yaml';

describe('ConfigTransformTask tests', () => {
	before(() => {
		// Set Node version for MockTestRunner to use Node 20
		process.env.TASK_TEST_NODE_VERSION = '20';
	});

	after(() => {
		delete process.env.TASK_TEST_NODE_VERSION;
	});

	it('json transformation should succeed', function (done: Mocha.Done) {
		this.timeout(30000);

		const tp: string = path.join(__dirname, 'json_success.js');
		const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

		const filePath = path.join(__dirname, 'appsettings.json');

		const content = `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`;

		fs.writeFile(filePath, content, err => {
			if (err) {
				console.error(err);
				done(err);
				return;
			}

			tr.runAsync(20)
				.then(() => {
					assert.equal(tr.succeeded, true, 'should have succeeded');
					assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
					assert.equal(tr.errorIssues.length, 0, 'should have no errors');

					fs.readFile(filePath, 'utf-8', (err, fileContent) => {
						if (err) {
							done(err);
							return;
						}

						const parsedContent = JSON.parse(fileContent);
						assert.equal(
							parsedContent.InsuranceConfig.BuildVersion,
							'1.2.3.4',
							'should have updated BuildVersion',
						);

						fs.unlinkSync(filePath);
						done();
					});
				})
				.catch(error => {
					try {
						fs.unlinkSync(filePath);
					} catch {}
					done(error);
				});
		});
	});

	it('json transformation with whitespace should succeed', function (done: Mocha.Done) {
		this.timeout(30000);

		const tp: string = path.join(__dirname, 'json_whitespace.js');
		const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

		const filePath = path.join(__dirname, 'appsettings.json');

		const content = `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`;

		fs.writeFile(filePath, content, err => {
			if (err) {
				console.error(err);
				done(err);
				return;
			}

			tr.runAsync(20)
				.then(() => {
					assert.equal(tr.succeeded, true, 'should have succeeded');
					assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
					assert.equal(tr.errorIssues.length, 0, 'should have no errors');

					fs.readFile(filePath, 'utf-8', (err, fileContent) => {
						if (err) {
							done(err);
							return;
						}

						const parsedContent = JSON.parse(fileContent);
						assert.equal(
							parsedContent.InsuranceConfig.BuildVersion,
							'1.2.3.4',
							'should have updated BuildVersion',
						);

						fs.unlinkSync(filePath);
						done();
					});
				})
				.catch(error => {
					try {
						fs.unlinkSync(filePath);
					} catch {}
					done(error);
				});
		});
	});

	it('json transformation with BOM should succeed', function (done: Mocha.Done) {
		this.timeout(30000);

		const tp: string = path.join(__dirname, 'json_bom.js');
		const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

		const filePath = path.join(__dirname, 'appsettings.json');

		const content = `{
  "InsuranceConfig": {
    "BuildVersion": "0.0.0.0"
  }
}`;

		fs.writeFile(filePath, content, err => {
			if (err) {
				console.error(err);
				done(err);
				return;
			}

			tr.runAsync(20)
				.then(() => {
					assert.equal(tr.succeeded, true, 'should have succeeded');
					assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
					assert.equal(tr.errorIssues.length, 0, 'should have no errors');

					fs.readFile(filePath, 'utf-8', (err, fileContent) => {
						if (err) {
							done(err);
							return;
						}

						const parsedContent = JSON.parse(fileContent);
						assert.equal(
							parsedContent.InsuranceConfig.BuildVersion,
							'1.2.3.4',
							'should have updated BuildVersion',
						);

						fs.unlinkSync(filePath);
						done();
					});
				})
				.catch(error => {
					try {
						fs.unlinkSync(filePath);
					} catch {}
					done(error);
				});
		});
	});

	// Test currently doesn't work (probably due to mocha and local file system)
	it('flat file transformation should succeed', function (done: Mocha.Done) {
		this.timeout(30000);

		const tp: string = path.join(__dirname, 'flat_success.js');
		const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

		const filePath = path.join(__dirname, 'flat.txt');

		const content = `ENV=development
BASE_URL=http://localhost:8080
APP_NAME=UnitTests`;

		fs.writeFile(filePath, content, err => {
			if (err) {
				console.error(err);
				done(err);
				return;
			}

			tr.runAsync(20)
			.then(() => {
				assert.equal(tr.succeeded, true, 'should have succeeded');
				assert.equal(tr.warningIssues.length, 0, 'should have no warnings');
				assert.equal(tr.errorIssues.length, 0, 'should have no errors');

				fs.readFile(filePath, 'utf-8', (err, fileContent) => {
					if (err) throw err;
					console.log(fileContent);
					assert.equal(fileContent.includes('ENV=CHANGED'), true, 'should have changed ENV');
					assert.equal(
						fileContent.includes('BASE_URL=https://example.com'),
						true,
						'should have changed BASE_URL',
					);
					assert.equal(fileContent.includes('API_KEY'), true, 'should have added API_KEY');
					assert.equal(fileContent.includes('APP_NAME=UnitTests'), true, 'should have kept APP_NAME');

					// Clean up the test file after assertions
					fs.unlinkSync(filePath);
					done();
				});
			})
			.catch(error => {
				done(error);
			});
		});
	});

	it('yaml transformation should succeed', () => {
		const yamlInput = `app:
  environment: development
database:
  host: localhost
`;
		const transformed = transformYaml(yamlInput, '{"app.environment":"production","database.host":"prod-db"}');
		assert.equal(transformed.includes('environment: production'), true, 'should update app.environment');
		assert.equal(transformed.includes('host: prod-db'), true, 'should update database.host');
	});

	it('flat transformation should preserve comments and malformed lines', () => {
		const input = '# comment\nENV=development\nMALFORMED_LINE\n';
		const transformed = transformFlatFile(input, '{"ENV":"production","NEW_KEY":"value"}', '=');

		assert.equal(transformed.includes('# comment'), true, 'should preserve comments');
		assert.equal(transformed.includes('MALFORMED_LINE'), true, 'should preserve malformed lines');
		assert.equal(transformed.includes('ENV=production'), true, 'should update existing values');
		assert.equal(transformed.includes('NEW_KEY=value'), true, 'should append missing keys');
	});

	it('flat transformation should fail on invalid transformations JSON', () => {
		assert.throws(
			() => transformFlatFile('ENV=development', '{', '='),
			/Failed to parse transformations JSON/,
			'should fail with a parse error for malformed JSON',
		);
	});

	it('yaml transformation should fail when root is not an object', () => {
		assert.throws(
			() => transformYaml('- one\n- two', '{"app.environment":"production"}'),
			/Target YAML must be a YAML object/,
			'should fail for YAML arrays at root',
		);
	});

	it('file validity should support uppercase extensions', () => {
		assert.equal(checkFileValidity('test.JSON', 'json'), true, 'JSON extension should be case insensitive');
		assert.equal(checkFileValidity('test.YmL', 'yaml'), true, 'YAML extension should be case insensitive');
		assert.equal(checkFileValidity('test.env', 'flat'), true, 'flat files should pass extension validation');
		assert.equal(checkFileValidity('test.xml', 'xml'), true, 'xml files should pass extension validation');
	});
});
