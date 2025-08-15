<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	// Create a writable store for smooth movement
	const position = writable({ x: 0, y: 0 });
	
	// Spring physics parameters
	const stiffness = 0.1;
	const damping = 0.6;
	
	// Target and current positions
	let target = { x: 0, y: 0 };
	let current = { x: 0, y: 0 };
	let velocity = { x: 0, y: 0 };
	
	// Create another store for buttons with a different motion effect
	const buttonPosition = writable({ x: 0, y: 0 });
	let buttonTarget = { x: 0, y: 0 };
	let buttonCurrent = { x: 0, y: 0 };
	let buttonVelocity = { x: 0, y: 0 };
	
	// Animation frame handler
	let animationId: number;
	
	function animate() {
		// Calculate spring physics for logo
		const dx = target.x - current.x;
		const dy = target.y - current.y;
		
		// Apply spring force
		velocity.x += dx * stiffness;
		velocity.y += dy * stiffness;
		
		// Apply damping
		velocity.x *= damping;
		velocity.y *= damping;
		
		// Update position
		current.x += velocity.x;
		current.y += velocity.y;
		
		// Update store
		position.set(current);
		
		// Calculate spring physics for buttons (with different parameters)
		const buttonDx = buttonTarget.x - buttonCurrent.x;
		const buttonDy = buttonTarget.y - buttonCurrent.y;
		
		// Apply spring force (slightly different stiffness for varied effect)
		buttonVelocity.x += buttonDx * (stiffness * 0.8);
		buttonVelocity.y += buttonDy * (stiffness * 0.8);
		
		// Apply damping
		buttonVelocity.x *= damping;
		buttonVelocity.y *= damping;
		
		// Update position
		buttonCurrent.x += buttonVelocity.x;
		buttonCurrent.y += buttonVelocity.y;
		
		// Update button store
		buttonPosition.set(buttonCurrent);
		
		// Continue animation
		animationId = requestAnimationFrame(animate);
	}
	
	// Only run animation in browser environment
	onMount(() => {
		if (browser) {
			animationId = requestAnimationFrame(animate);
			
			// Cleanup on component unmount
			return () => {
				cancelAnimationFrame(animationId);
			};
		}
	});
	
	function handleMouseMove(event: MouseEvent) {
		// Calculate mouse position relative to center of viewport
		const mouseX = event.clientX - window.innerWidth / 2;
		const mouseY = event.clientY - window.innerHeight / 2;
		
		// Update the target position for logo (which our spring animation will follow)
		target.x = mouseX * 0.02;
		target.y = mouseY * 0.02;
		
		// Update the target position for buttons (same direction as logo, but different intensity)
		buttonTarget.x = mouseX * 0.01; // Same direction, but less movement
		buttonTarget.y = mouseY * 0.01;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-black" on:mousemove={handleMouseMove} role="application">
	<div class="relative mb-4 max-w-md pl-8"> <!-- Added pl-8 to shift logo right -->
		<img 
			src="/logo.png" 
			alt="Axon Logo" 
			class="relative max-w-md" 
			style="transform: translate({$position.x}px, {$position.y}px);"
		/>
	</div>
	<div class="mt-4 flex space-x-6" style="transform: translate({$buttonPosition.x}px, {$buttonPosition.y}px);"> <!-- Increased space between buttons -->
		<a
			href="/login"
			class="relative overflow-hidden px-8 py-3 text-sm font-medium text-black shadow-md transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg focus:outline-none focus:ring focus:ring-black focus:ring-opacity-80 active:scale-95"
			style="background: #ffffff;"
		>
			<span class="relative z-10">Login</span>
			<span class="absolute inset-0 z-0 bg-white opacity-0 transition-opacity duration-300 ease-out hover:opacity-10"></span>
		</a>
		<a
			href="/register"
			class="relative overflow-hidden px-8 py-3 text-sm font-medium text-white shadow-md transition-all duration-300 ease-out hover:scale-105 hover:shadow-lg focus:outline-none focus:ring focus:ring-white focus:ring-opacity-80 active:scale-95 border-2 border-white"
			style="background: #000000;"
		>
			<span class="relative z-10">Register</span>
			<span class="absolute inset-0 z-0 bg-white opacity-0 transition-opacity duration-300 ease-out hover:opacity-20"></span>
		</a>
	</div>
</div>
