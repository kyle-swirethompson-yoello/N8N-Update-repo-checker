<script lang="ts">
import type { PropType } from 'vue';
import { computed, defineComponent, ref, useCssModule } from 'vue';
import type { DatatableColumn, DatatableRow, DatatableRowDataType } from '../../types';
import { getValueByPath } from '../../utils';
import { useI18n } from '../../composables/useI18n';
import N8nSelect from '../N8nSelect';
import N8nOption from '../N8nOption';
import N8nPagination from '../N8nPagination';

export default defineComponent({
	name: 'N8nDatatable',
	components: {
		N8nSelect,
		N8nOption,
		N8nPagination,
	},
	props: {
		columns: {
			type: Array as PropType<DatatableColumn[]>,
			required: true,
		},
		rows: {
			type: Array as PropType<DatatableRow[]>,
			required: true,
		},
		currentPage: {
			type: Number,
			default: 1,
		},
		pagination: {
			type: Boolean,
			default: true,
		},
		rowsPerPage: {
			type: [Number, String] as PropType<number | '*'>,
			default: 10,
		},
	},
	emits: ['update:currentPage', 'update:rowsPerPage'],
	setup(props, { emit }) {
		const { t } = useI18n();
		const rowsPerPageOptions = ref([10, 25, 50, 100]);

		const style = useCssModule();

		const totalPages = computed(() => {
			if (props.rowsPerPage === '*') {
				return 1;
			}

			return Math.ceil(props.rows.length / props.rowsPerPage);
		});

		const totalRows = computed(() => {
			return props.rows.length;
		});

		const visibleRows = computed(() => {
			if (props.rowsPerPage === '*') {
				return props.rows;
			}

			const start = (props.currentPage - 1) * props.rowsPerPage;
			const end = start + props.rowsPerPage;

			return props.rows.slice(start, end);
		});

		const classes = computed(() => {
			return {
				datatable: true,
				[style.datatableWrapper]: true,
			};
		});

		function onUpdateCurrentPage(value: number) {
			emit('update:currentPage', value);
		}

		function onRowsPerPageChange(value: number | '*') {
			emit('update:rowsPerPage', value);

			const maxPage = value === '*' ? 1 : Math.ceil(totalRows.value / value);
			if (maxPage < props.currentPage) {
				onUpdateCurrentPage(maxPage);
			}
		}

		function getTdValue(row: DatatableRow, column: DatatableColumn) {
			return getValueByPath<DatatableRowDataType>(row, column.path);
		}

		function getThStyle(column: DatatableColumn) {
			return {
				...(column.width ? { width: column.width } : {}),
			};
		}

		return {
			t,
			classes,
			totalPages,
			totalRows,
			visibleRows,
			rowsPerPageOptions,
			getTdValue,
			getThStyle,
			onUpdateCurrentPage,
			onRowsPerPageChange,
		};
	},
});
</script>

<template>
	<div :class="classes" v-bind="$attrs">
		<table :class="$style.datatable">
			<thead :class="$style.datatableHeader">
				<tr>
					<th
						v-for="column in columns"
						:key="column.id"
						:class="column.classes"
						:style="getThStyle(column)"
					>
						{{ column.label }}
					</th>
				</tr>
			</thead>
			<tbody>
				<template v-for="row in visibleRows">
					<slot name="row" :columns="columns" :row="row" :get-td-value="getTdValue">
						<tr :key="row.id">
							<td v-for="column in columns" :key="column.id" :class="column.classes">
								<component :is="column.render" v-if="column.render" :row="row" :column="column" />
								<span v-else>{{ getTdValue(row, column) }}</span>
							</td>
						</tr>
					</slot>
				</template>
			</tbody>
		</table>

		<div :class="$style.pagination">
			<N8nPagination
				v-if="totalPages > 1"
				background
				:pager-count="5"
				:page-size="rowsPerPage"
				layout="prev, pager, next"
				:total="totalRows"
				:current-page="currentPage"
				@update:currentPage="onUpdateCurrentPage"
			/>

			<div :class="$style.pageSizeSelector">
				<N8nSelect
					size="mini"
					:model-value="rowsPerPage"
					teleported
					@update:modelValue="onRowsPerPageChange"
				>
					<template #prepend>{{ t('datatable.pageSize') }}</template>
					<N8nOption
						v-for="size in rowsPerPageOptions"
						:key="size"
						:label="`${size}`"
						:value="size"
					/>
					<N8nOption :label="`All`" value="*"> </N8nOption>
				</N8nSelect>
			</div>
		</div>
	</div>
</template>

<style lang="scss" module>
.datatableWrapper {
	display: block;
	width: 100%;
}

.datatable {
	width: 100%;

	tbody {
		tr {
			td {
				vertical-align: top;
				color: var(--color-text-base);
				padding: var(--spacing-s) var(--spacing-2xs);
			}

			&:nth-of-type(even) {
				background: var(--color-background-xlight);
			}

			&:nth-of-type(odd) {
				background: var(--color-background-light);
			}
		}
	}
}

.datatableHeader {
	background: var(--color-background-base);

	th {
		text-align: left;
		padding: var(--spacing-s) var(--spacing-2xs);
	}
}

.pagination {
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	bottom: 0;
	overflow: visible;
	margin-top: var(--spacing-s);
}

.pageSizeSelector {
	text-transform: capitalize;
	max-width: 150px;
	flex: 0 1 auto;
}
</style>
