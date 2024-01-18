import {
	type INodeProperties,
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import { updateDisplayOptions } from '../../../../../utils/utilities';
import { apiRequest } from '../../transport';
import get from 'lodash/get';

const properties: INodeProperties[] = [
	// {
	// 	displayName: 'Model',
	// 	name: 'model',
	// 	type: 'options',
	// 	default: 'gpt-4-vision-preview',
	// 	options: [
	// 		{
	// 			name: 'GPT-4 Vision Preview',
	// 			value: 'gpt-4-vision-preview',
	// 		},
	// 	],
	// },
	{
		displayName: 'Text Input',
		name: 'text',
		type: 'string',
		placeholder: "e.g. What's in this image?",
		default: "What's in this image?",
		typeOptions: {
			rows: 2,
		},
	},
	{
		displayName: 'Input Type',
		name: 'inputType',
		type: 'options',
		default: 'url',
		options: [
			{
				name: 'Image URL(s)',
				value: 'url',
			},
			{
				name: 'Binary File(s)',
				value: 'base64',
			},
		],
	},
	{
		displayName: 'URL(s)',
		name: 'imageUrls',
		type: 'string',
		placeholder: 'e.g. https://example.com/image.jpeg',
		description: 'URL(s) of the image(s) to analyze, multiple URLs can be added separated by comma',
		default: '',
		displayOptions: {
			show: {
				inputType: ['url'],
			},
		},
	},
	{
		displayName: 'Input Binary Field(s)',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		placeholder: 'e.g. data',
		description: 'Name of the binary property which contains the image(s)',
		displayOptions: {
			show: {
				inputType: ['base64'],
			},
		},
	},
	{
		displayName: 'Simplify',
		name: 'simplify',
		type: 'boolean',
		default: true,
		description: 'Whether to simplify the response or not',
	},
	{
		displayName: 'Options',
		name: 'options',
		placeholder: 'Add Option',
		type: 'collection',
		default: {},
		options: [
			{
				displayName: 'Detail',
				name: 'detail',
				type: 'options',
				default: 'auto',
				options: [
					{
						name: 'Auto',
						value: 'auto',
						description:
							'Model will look at the image input size and decide if it should use the low or high setting',
					},
					{
						name: 'Low',
						value: 'low',
						description: 'Return faster responses and consume fewer tokens',
					},
					{
						name: 'High',
						value: 'high',
						description: 'Return more detailed responses, consumes more tokens',
					},
				],
			},
			{
				displayName: 'Length of Description (Max Tokens)',
				description: 'Fewer tokens will result in shorter, less detailed image description',
				name: 'maxTokens',
				type: 'number',
				default: 300,
				typeOptions: {
					minValue: 1,
				},
			},
		],
	},
];

const displayOptions = {
	show: {
		operation: ['analyzeImage'],
	},
};

export const description = updateDisplayOptions(displayOptions, properties);

export async function execute(this: IExecuteFunctions, i: number): Promise<INodeExecutionData[]> {
	// const model = this.getNodeParameter('model', i) as string;
	const model = 'gpt-4-vision-preview';
	const text = this.getNodeParameter('text', i, '') as string;
	const inputType = this.getNodeParameter('inputType', i) as string;
	const options = this.getNodeParameter('options', i, {});

	const content: IDataObject[] = [
		{
			type: 'text',
			text,
		},
	];

	const detail = (options.detail as string) || 'auto';

	if (inputType === 'url') {
		const imageUrls = (this.getNodeParameter('imageUrls', i) as string)
			.split(',')
			.map((url) => url.trim());

		for (const url of imageUrls) {
			content.push({
				type: 'image_url',
				image_url: {
					url,
					detail,
				},
			});
		}
	} else {
		const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i)
			.split(',')
			.map((propertyName) => propertyName.trim());

		for (const propertyName of binaryPropertyName) {
			const binaryData = get(this.getInputData(i)[0].binary, propertyName);

			if (!binaryData) {
				throw new NodeOperationError(this.getNode(), 'No binary data exists on item!');
			}

			content.push({
				type: 'image_url',
				image_url: {
					url: `data:${binaryData.mimeType};base64,${binaryData.data}`,
					detail,
				},
			});
		}
	}

	const body = {
		model,
		messages: [
			{
				role: 'user',
				content,
			},
		],
		max_tokens: (options.maxTokens as number) || 300,
	};

	let response = await apiRequest.call(this, 'POST', '/chat/completions', { body });

	const simplify = this.getNodeParameter('simplify', i) as boolean;

	if (simplify && response.choices) {
		response = { content: response.choices[0].message.content };
	}

	return [
		{
			json: response,
			pairedItem: { item: i },
		},
	];
}
