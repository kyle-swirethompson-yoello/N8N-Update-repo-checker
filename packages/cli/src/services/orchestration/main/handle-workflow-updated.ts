import { ActiveWorkflowRunner } from '@/ActiveWorkflowRunner';
import { WorkflowRepository } from '@/databases/repositories/workflow.repository';
import { Push } from '@/push';
import { OrchestrationService } from '@/services/orchestration.service';
import Container from 'typedi';

type WorkflowUpdatedPayload = {
	workflowId: string;
	oldState: boolean;
	newState: boolean;
	versionId: string;
};

const isValidPayload = (payload?: Record<string, unknown>): payload is WorkflowUpdatedPayload => {
	const { workflowId, oldState, newState, versionId } = payload ?? {};

	return (
		typeof workflowId === 'string' &&
		typeof oldState === 'boolean' &&
		typeof newState === 'boolean' &&
		typeof versionId === 'string'
	);
};

/**
 * In multi-main setup, the leader should react to a `workflow-updated` message
 * from a follower by managing the leader's active triggers and pollers.
 */
export async function handleWorkflowUpdated(payload?: Record<string, unknown>) {
	const orchestrationService = Container.get(OrchestrationService);

	if (orchestrationService.isFollower) return;

	if (!isValidPayload(payload)) return;

	const { workflowId, oldState, newState, versionId } = payload;

	const activeWorkflowRunner = Container.get(ActiveWorkflowRunner);
	const push = Container.get(Push);
	const workflowRepository = Container.get(WorkflowRepository);

	await activeWorkflowRunner.removeActivationError(workflowId);

	/**
	 * Leader reacts to workflow activation by adding triggers and pollers
	 * and informing frontend about the activation.
	 */
	if (!oldState && newState) {
		try {
			await activeWorkflowRunner.add(workflowId, 'activate');
			push.broadcast('workflowActivated', { workflowId });

			return;
		} catch (error) {
			if (error instanceof Error) {
				await workflowRepository.update(workflowId, { active: false, versionId });

				await orchestrationService.publish('workflow-failed-to-activate', {
					workflowId,
					errorMessage: error.message,
				});
			}

			return;
		}
	}

	/**
	 * Leader reacts to workflow deactivation by removing triggers and pollers
	 * and informing frontend about the deactivation.
	 */
	if (oldState && !newState) {
		await activeWorkflowRunner.remove(workflowId);
		push.broadcast('workflowDeactivated', { workflowId });

		return;
	}

	/**
	 * Leader reacts to workflow update that did not change active state
	 * by removing and re-adding triggers and pollers so that the new value
	 * takes effect.
	 */
	await activeWorkflowRunner.remove(workflowId);
	await activeWorkflowRunner.add(workflowId, 'update');
}
