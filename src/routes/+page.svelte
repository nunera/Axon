<script lang="ts">
	import { writable } from 'svelte/store';
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	
	const position = writable({ x: 0, y: 0 });
	
	const stiffness = 0.1;
	const damping = 0.6;
	
	let target = { x: 0, y: 0 };
	let current = { x: 0, y: 0 };
	let velocity = { x: 0, y: 0 };
	
	const buttonPosition = writable({ x: 0, y: 0 });
	let buttonTarget = { x: 0, y: 0 };
	let buttonCurrent = { x: 0, y: 0 };
	let buttonVelocity = { x: 0, y: 0 };
	
	let animationId: number;
	
	function animate() {
		const dx = target.x - current.x;
		const dy = target.y - current.y;
		
		velocity.x += dx * stiffness;
		velocity.y += dy * stiffness;
		
		velocity.x *= damping;
		velocity.y *= damping;
		
		current.x += velocity.x;
		current.y += velocity.y;
		
		position.set(current);
		
		const buttonDx = buttonTarget.x - buttonCurrent.x;
		const buttonDy = buttonTarget.y - buttonCurrent.y;
		
		buttonVelocity.x += buttonDx * (stiffness * 0.8);
		buttonVelocity.y += buttonDy * (stiffness * 0.8);
		
		buttonVelocity.x *= damping;
		buttonVelocity.y *= damping;
		
		buttonCurrent.x += buttonVelocity.x;
		buttonCurrent.y += buttonVelocity.y;
		
		buttonPosition.set(buttonCurrent);
		
		animationId = requestAnimationFrame(animate);
	}
	
	onMount(() => {
		if (browser) {
			animationId = requestAnimationFrame(animate);
			
			return () => {
				cancelAnimationFrame(animationId);
			};
		}
	});
	
	function handleMouseMove(event: MouseEvent) {
		const mouseX = event.clientX - window.innerWidth / 2;
		const mouseY = event.clientY - window.innerHeight / 2;
		
		target.x = mouseX * 0.02;
		target.y = mouseY * 0.02;
		
		buttonTarget.x = mouseX * 0.01;
		buttonTarget.y = mouseY * 0.01;
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center bg-black" on:mousemove={handleMouseMove} role="application">
	<div class="relative mb-4 max-w-md pl-8">
		<img 
			src="/logo.png" 
			alt="Axon Logo" 
			class="relative max-w-md" 
			style="transform: translate({$position.x}px, {$position.y}px);"
		/>
	</div>
	<div class="mt-4 flex space-x-6" style="transform: translate({$buttonPosition.x}px, {$buttonPosition.y}px);">
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
