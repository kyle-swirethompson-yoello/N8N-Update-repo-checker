export class Semaphore {
	private waiting: Array<[string, () => void]> = [];

	constructor(private capacity: number) {}

	async acquire(id: string) {
		this.capacity--;
		if (this.capacity < 0) {
			// eslint-disable-next-line @typescript-eslint/return-await
			return new Promise<void>((resolve) => this.waiting.push([id, resolve]));
		}
	}

	remove(id: string) {
		const index = this.waiting.findIndex((item) => item[0] === id);
		if (index > -1) {
			this.waiting.splice(index, 1);
			this.next();
		}
	}

	release(): void {
		this.capacity++;
		this.next();
	}

	private next() {
		this.waiting.shift()?.[1]();
	}
}
