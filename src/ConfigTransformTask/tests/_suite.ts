import * as assert from 'assert';
import * as ttm from 'azure-pipelines-task-lib/mock-test';
import fs from 'node:fs';
import * as path from 'path';

describe('ConfigTransformTask tests', function () {
	before(function () {});

	after(() => {});

	// Test currently doesn't work (probably due to mocha and local file system)
	it('flat file transformation should succeed', function (done: Mocha.Done) {
		this.timeout(1000);

		const tp: string = path.join(__dirname, 'flat_success.js');
		const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

		const filePath = path.join(__dirname, 'flat.txt');

		const content = `ENV=development
BASE_URL=http://localhost:8080
APP_NAME=UnitTests`;

		fs.writeFile(filePath, content, err => {
			if (err) {
				console.error(err);
			}
		});

		tr.runAsync()
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

					done();
				});

				fs.unlinkSync(filePath);
			})
			.catch(error => {
				done(error);
			});
	});
});
