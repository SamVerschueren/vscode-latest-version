'use strict';

import {workspace, extensions, ReadOnlyMemento, Disposable} from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const latestVersion = require('latest-version');
const semver = require('semver');

export function activate() {
	const config = extensions.getConfigurationMemento('npm');

	try {
		const versionController = new VersionController(config);
	} catch (err) {
		// show error message
	}
}

export class VersionController {

	private _disposable: Disposable;
	private _config: ReadOnlyMemento;

	constructor(config: ReadOnlyMemento) {
		this._config = config;

		let subscriptions: Disposable[] = [];

		workspace.onDidChangeTextDocument(this.checkDependencies, this, subscriptions);

		this._disposable = Disposable.of(...subscriptions);
	}

	public checkDependencies(event: any) {
		if (path.basename(event.document._uri) !== 'package.json') {
			return;
		}

		try {
			const pkg = JSON.parse(event.document._lines.join(event.document._eol));

			Promise.all(Object.keys(pkg.dependencies).map(dependency => {
				const installedVersion = pkg.dependencies[dependency];

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
		} catch (err) {
			console.log(err.message);
		}
	}
}
