// --- WEB LOCKS POLYFILL ---
// Generate a unique ID for this specific browser window/instance
const INSTANCE_ID = Math.random().toString(36).substring(2, 15);
/**
 * A custom polyfill for navigator.locks.request using localStorage
 * Supports both:
 * request(name, callback)
 * request(name, options, callback)
 */
async function requestCustomLock(name, optionsOrCallback, optionalCallback) {
	let options = {};
	let callback;

	// Handle the two different signatures
	if (typeof optionsOrCallback === 'function') {
		callback = optionsOrCallback;
	} else {
		options = optionsOrCallback || {};
		callback = optionalCallback;
	}

	const lockKey = `custom_lock_${name}`;
	const heartbeatInterval = 2000;
	const lockTTL = 5000;

	// 1. Try to acquire the lock
	while (true) {
		let currentLock = JSON.parse(localStorage.getItem(lockKey) || 'null');
		let now = Date.now();

		if (!currentLock || now > currentLock.expires) {
			const claim = { id: INSTANCE_ID, expires: now + lockTTL };
			localStorage.setItem(lockKey, JSON.stringify(claim));

			// Wait 50ms for collision detection
			await new Promise(r => setTimeout(r, 50));

			let verifyLock = JSON.parse(localStorage.getItem(lockKey) || 'null');
			if (verifyLock && verifyLock.id === INSTANCE_ID) {
				break; // WE WON THE LOCK!
			}
		}

		// Wait a random amount of time (between 500ms and 1s) and try again
		await new Promise(r => setTimeout(r, Math.random() * 500 + 500));
	}

	// 2. We own the lock! Start the heartbeat
	const renewTimer = setInterval(() => {
		localStorage.setItem(lockKey, JSON.stringify({ id: INSTANCE_ID, expires: Date.now() + lockTTL }));
	}, heartbeatInterval);

	try {
		// 3. Run the callback, passing a mock "lock" object to match native behavior
		const mockLock = { name: name, mode: options.mode || 'exclusive' };
		await callback(mockLock);
	} finally {
		// 4. Clean up the lock
		clearInterval(renewTimer);
		let checkLock = JSON.parse(localStorage.getItem(lockKey) || 'null');
		if (checkLock && checkLock.id === INSTANCE_ID) {
			localStorage.removeItem(lockKey);
		}
	}
}

// --- WEB LOCKS POLYFILL INJECTION ---
if (typeof navigator.locks === 'undefined') {
	Object.defineProperty(navigator, 'locks', {
		value: {
			request: requestCustomLock
		},
		writable: true,
		configurable: true
	});
	// console.log("Injected custom Web Locks polyfill for OBS local files.");
}