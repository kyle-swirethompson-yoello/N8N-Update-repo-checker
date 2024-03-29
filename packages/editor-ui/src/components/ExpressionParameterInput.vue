<template>
	<div
		v-on-click-outside="onBlur"
		:class="$style['expression-parameter-input']"
		@keydown.tab="onBlur"
	>
		<div :class="[$style['all-sections'], { [$style['focused']]: isFocused }]">
			<div :class="[$style['prepend-section'], 'el-input-group__prepend']">
				<ExpressionFunctionIcon />
			</div>
			<InlineExpressionEditorInput
				ref="inlineInput"
				:model-value="modelValue"
				:is-read-only="isReadOnly"
				:target-item="hoveringItem"
				:is-single-line="isSingleLine"
				:additional-data="additionalExpressionData"
				:path="path"
				@focus="onFocus"
				@blur="onBlur"
				@change="onChange"
			/>
			<n8n-button
				v-if="!isDragging"
				square
				outline
				type="tertiary"
				icon="external-link-alt"
				size="xsmall"
				:class="$style['expression-editor-modal-opener']"
				data-test-id="expander"
				@click="$emit('modalOpenerClick')"
			/>
		</div>
		<InlineExpressionEditorOutput
			:segments="segments"
			:is-read-only="isReadOnly"
			:visible="isFocused"
			:hovering-item-number="hoveringItemNumber"
		/>
	</div>
</template>

<script lang="ts">
import { mapStores } from 'pinia';
import type { PropType } from 'vue';
import { defineComponent } from 'vue';

import { useNDVStore } from '@/stores/ndv.store';
import { useWorkflowsStore } from '@/stores/workflows.store';
import InlineExpressionEditorInput from '@/components/InlineExpressionEditor/InlineExpressionEditorInput.vue';
import InlineExpressionEditorOutput from '@/components/InlineExpressionEditor/InlineExpressionEditorOutput.vue';
import ExpressionFunctionIcon from '@/components/ExpressionFunctionIcon.vue';
import { createExpressionTelemetryPayload } from '@/utils/telemetryUtils';

import type { Segment } from '@/types/expressions';
import type { TargetItem } from '@/Interface';
import type { IDataObject } from 'n8n-workflow';

type InlineExpressionEditorInputRef = InstanceType<typeof InlineExpressionEditorInput>;

export default defineComponent({
	name: 'ExpressionParameterInput',
	components: {
		InlineExpressionEditorInput,
		InlineExpressionEditorOutput,
		ExpressionFunctionIcon,
	},
	props: {
		path: {
			type: String,
		},
		modelValue: {
			type: String,
		},
		isReadOnly: {
			type: Boolean,
			default: false,
		},
		isSingleLine: {
			type: Boolean,
			default: false,
		},
		additionalExpressionData: {
			type: Object as PropType<IDataObject>,
			default: () => ({}),
		},
	},
	data() {
		return {
			isFocused: false,
			segments: [] as Segment[],
		};
	},
	computed: {
		...mapStores(useNDVStore, useWorkflowsStore),
		hoveringItemNumber(): number {
			return this.ndvStore.hoveringItemNumber;
		},
		hoveringItem(): TargetItem | null {
			return this.ndvStore.getHoveringItem;
		},
		isDragging(): boolean {
			return this.ndvStore.isDraggableDragging;
		},
	},
	methods: {
		focus() {
			const inlineInputRef = this.$refs.inlineInput as InlineExpressionEditorInputRef | undefined;
			if (inlineInputRef?.$el) {
				inlineInputRef.focus();
			}
		},
		onFocus() {
			this.isFocused = true;

			this.$emit('focus');
		},
		onBlur(event: FocusEvent | KeyboardEvent) {
			if (
				event.target instanceof Element &&
				Array.from(event.target.classList).some((_class) => _class.includes('resizer'))
			) {
				return; // prevent blur on resizing
			}

			if (this.isDragging) return; // prevent blur on dragging

			const wasFocused = this.isFocused;

			this.isFocused = false;

			this.$emit('blur');

			if (wasFocused) {
				const telemetryPayload = createExpressionTelemetryPayload(
					this.segments,
					this.modelValue,
					this.workflowsStore.workflowId,
					this.ndvStore.sessionId,
					this.ndvStore.activeNode?.type ?? '',
				);

				this.$telemetry.track('User closed Expression Editor', telemetryPayload);
			}
		},
		onChange({ value, segments }: { value: string; segments: Segment[] }) {
			if (this.isDragging) return;

			this.segments = segments;

			if (value === '=' + this.modelValue) return; // prevent report on change of target item

			this.$emit('update:modelValue', value);
		},
	},
});
</script>

<style lang="scss" module>
.expression-parameter-input {
	position: relative;

	:global(.cm-editor) {
		background-color: var(--color-code-background);
	}

	.all-sections {
		height: 30px;
		display: flex;
		flex-direction: row;
		display: inline-table;
		width: 100%;
	}

	.prepend-section {
		padding: 0;
		padding-top: 2px;
		width: 22px;
		text-align: center;
	}
}

.expression-editor-modal-opener {
	position: absolute;
	right: 0;
	bottom: 0;
	background-color: var(--color-code-background);
	padding: 3px;
	line-height: 9px;
	border: var(--input-border-color, var(--border-color-base))
		var(--input-border-style, var(--border-style-base))
		var(--input-border-width, var(--border-width-base));
	cursor: pointer;

	&:hover {
		border: var(--input-border-color, var(--border-color-base))
			var(--input-border-style, var(--border-style-base))
			var(--input-border-width, var(--border-width-base));
	}

	svg {
		width: 9px !important;
		height: 9px;
		transform: rotate(270deg);
	}
}

.focused > .prepend-section {
	border-color: var(--color-secondary);
	border-bottom-left-radius: 0;
}

.focused :global(.cm-editor) {
	border-color: var(--color-secondary);
}

.focused > .expression-editor-modal-opener {
	border-color: var(--color-secondary);
	border-bottom-right-radius: 0;
	background-color: var(--color-code-background);
}
</style>
