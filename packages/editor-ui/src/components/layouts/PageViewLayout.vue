<template>
	<div :class="[$style.wrapper, !uiStore.sidebarMenuCollapsed && $style.expandedSidebar]">
		<div :class="$style.container">
			<aside v-if="$slots.aside" :class="$style.aside">
				<slot name="aside" />
			</aside>
			<main :class="$style.content">
				<slot />
			</main>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { mapStores } from 'pinia';
import { useUIStore } from '@/stores/ui.store';

export default defineComponent({
	name: 'PageViewLayout',
	data() {
		return {
			loading: false,
		};
	},
	computed: {
		...mapStores(useUIStore),
	},
});
</script>

<style lang="scss" module>
.wrapper {
	display: flex;
	height: 100%;
	width: 100%;
	max-width: 1280px;
	justify-content: center;
	box-sizing: border-box;
	padding: var(--spacing-l) var(--spacing-l) 0;
	@media (min-width: 1200px) {
		padding: var(--spacing-2xl) var(--spacing-2xl) 0;
	}
}

.container {
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: row;
	height: 100%;
	width: 100%;
}

.aside {
	display: flex;
	flex-shrink: 0;
	flex-direction: column;
	height: 100%;
	width: 160px;
	margin-right: var(--spacing-l);

	@media (min-width: 1200px) {
		margin-right: var(--spacing-2xl);
	}
}

.content {
	display: flex;
	flex-direction: column;
	flex: 1 1 100%;
	height: 100%;
}

@media (max-width: 500px) {
	.container {
		flex-direction: column;
	}
	.aside {
		height: auto;
		margin: 0;
	}
}
</style>
