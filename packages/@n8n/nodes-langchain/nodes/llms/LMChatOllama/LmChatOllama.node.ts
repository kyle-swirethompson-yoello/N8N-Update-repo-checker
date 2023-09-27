/* eslint-disable n8n-nodes-base/node-dirname-against-convention */
import {
	NodeConnectionType,
	type IExecuteFunctions,
	type INodeType,
	type INodeTypeDescription,
	type SupplyData,
} from 'n8n-workflow';

import { ChatOllama } from 'langchain/chat_models/ollama';
// import { ChatAnthropic } from 'langchain/chat_models/anthropic';
import { logWrapper } from '../../../utils/logWrapper';

export class LmChatOllama implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Chat Ollama',
		// eslint-disable-next-line n8n-nodes-base/node-class-description-name-miscased
		name: 'lmChatOllama',
		icon: 'file:ollama.svg',
		group: ['transform'],
		version: 1,
		description: 'Language Model Ollama',
		defaults: {
			name: 'Chat Ollama',
		},
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Language Models'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatollama/',
					},
				],
			},
		},
		// eslint-disable-next-line n8n-nodes-base/node-class-description-inputs-wrong-regular-node
		inputs: [],
		// eslint-disable-next-line n8n-nodes-base/node-class-description-outputs-wrong
		outputs: [NodeConnectionType.AiLanguageModel],
		outputNames: ['Model'],
		credentials: [
			{
				name: 'ollamaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				options: [
					{
						name: 'Llama2',
						value: 'llama2',
					},
					{
						name: 'Llama2 13B',
						value: 'llama2:13b',
					},
					{
						name: 'Llama2 70B',
						value: 'llama2:70b',
					},
					{
						name: 'Llama2 Uncensored',
						value: 'llama2-uncensored',
					},
				],
				description: 'The model which will generate the completion',
				default: 'llama2',
			},
			{
				displayName: 'Options',
				name: 'options',
				placeholder: 'Add Option',
				description: 'Additional options to add',
				type: 'collection',
				default: {},
				options: [
					{
						displayName: 'Sampling Temperature',
						name: 'temperature',
						default: 0.7,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive.',
						type: 'number',
					},
					{
						displayName: 'Top K',
						name: 'topK',
						default: -1,
						typeOptions: { maxValue: 1, minValue: -1, numberPrecision: 1 },
						description:
							'Used to remove "long tail" low probability responses. Defaults to -1, which disables it.',
						type: 'number',
					},
					{
						displayName: 'Top P',
						name: 'topP',
						default: 1,
						typeOptions: { maxValue: 1, minValue: 0, numberPrecision: 1 },
						description:
							'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. We generally recommend altering this or temperature but not both.',
						type: 'number',
					},
				],
			},
		],
	};

	async supplyData(this: IExecuteFunctions): Promise<SupplyData> {
		const credentials = await this.getCredentials('ollamaApi');

		const itemIndex = 0;

		// TODO: Should it get executed once per item or not?
		const modelName = this.getNodeParameter('model', itemIndex) as string;
		const options = this.getNodeParameter('options', itemIndex, {}) as object;

		const model = new ChatOllama({
			baseUrl: credentials.baseUrl as string,
			model: modelName,
			...options,
		});

		return {
			response: logWrapper(model, this),
		};
	}
}