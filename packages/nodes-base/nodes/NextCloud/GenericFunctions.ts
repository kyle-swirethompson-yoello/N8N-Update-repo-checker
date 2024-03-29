import { NodeOperationError, type IExecuteFunctions, type IHookFunctions } from 'n8n-workflow';

import type { OptionsWithUri } from 'request';

/**
 * Make an API request to NextCloud
 *
 */
export async function nextCloudApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: string,
	endpoint: string,
	body: object | string | Buffer,
	headers?: object,
	encoding?: null | undefined,
	query?: object,
) {
	const resource = this.getNodeParameter('resource', 0);
	const operation = this.getNodeParameter('operation', 0);
	const authenticationMethod = this.getNodeParameter('authentication', 0);

	let credentials;

	if (authenticationMethod === 'accessToken') {
		credentials = (await this.getCredentials('nextCloudApi')) as { webDavUrl: string };
	} else {
		credentials = (await this.getCredentials('nextCloudOAuth2Api')) as { webDavUrl: string };
	}

	const options: OptionsWithUri = {
		headers,
		method,
		body,
		qs: query ?? {},
		uri: '',
		json: false,
	};

	if (encoding === null) {
		options.encoding = null;
	}

	options.uri = `${credentials.webDavUrl}/${encodeURI(endpoint)}`;

	if (resource === 'user' && operation === 'create') {
		options.uri = options.uri.replace('/remote.php/webdav', '');
	}

	if (resource === 'file' && operation === 'share') {
		options.uri = options.uri.replace('/remote.php/webdav', '');
	}

	const credentialType =
		authenticationMethod === 'accessToken' ? 'nextCloudApi' : 'nextCloudOAuth2Api';

	const response = await this.helpers.requestWithAuthentication.call(this, credentialType, options);

	if (typeof response === 'string' && response.includes('<b>Fatal error</b>')) {
		throw new NodeOperationError(
			this.getNode(),
			"NextCloud responded with a 'Fatal error', check description for more details",
			{
				description: `Server response:\n${response}`,
			},
		);
	}

	return response;
}
