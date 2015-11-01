'use strict';

import {workspace, extensions, ReadOnlyMemento} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const latestVersion = require('latest-version');
const semver = require('semver');

export function activate() {
	const config = extensions.getConfigurationMemento('npm');

	try {
		const versionController = new VersionController(config);
		versionController.checkDependencies();
	} catch (err) {
		// show error message
	}
}

export class VersionController {

	private _config: ReadOnlyMemento;
	private _pkg: any;

	constructor(config: ReadOnlyMemento) {
		this._config = config;

		this._loadPackageData();
	}

	public checkDependencies() {
		Promise.all(Object.keys(this._pkg.dependencies).map(dependency => {
			const installedVersion = this._pkg.dependencies[dependency];

			return latestVersion(dependency)
				.then(latestVersion => {
					if (!semver.satisfies(latestVersion, installedVersion)) {
						let obj = {};
						obj[dependency] = latestVersion;

						return obj;
					}
				});
		})).then(result => {
			console.log(JSON.stringify(result, undefined, '  '));
		});
	}

	private _loadPackageData() {
		this._pkg = JSON.parse(fs.readFileSync(path.join(workspace.getPath(), 'package.json'), 'utf8'));
	}
}
