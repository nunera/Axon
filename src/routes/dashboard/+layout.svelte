<script lang="ts">
	import { page } from '$app/stores';

	// Get user from the parent data
	$: ({ user } = $page.data);

	let dropdownOpen = false;
	let profileButton: HTMLButtonElement | null = null;
</script>

<div class="flex min-h-screen flex-col bg-black text-white">
	<!-- Navigation Bar -->
	<nav class="border-b border-white bg-black p-4">
		<div class="container mx-auto flex items-center justify-between">
			<div class="flex items-center space-x-6">
				<a href="/dashboard" class="text-xl font-bold">Axon</a>

				<div class="hidden space-x-6 md:flex">
					<a
						href="/dashboard"
						class="hover:text-white/80 {$page.url.pathname === '/dashboard'
							? 'border-b-2 border-white'
							: ''}"
					>
						Dashboard
					</a>
					<a
						href="/dashboard/organizations"
						class="hover:text-white/80 {$page.url.pathname.startsWith('/dashboard/organizations')
							? 'border-b-2 border-white'
							: ''}"
					>
						Organizations
					</a>
				</div>
			</div>

			<div class="flex items-center">
				<div
					class="relative"
					role="presentation"
					onmouseenter={() => (dropdownOpen = true)}
					onmouseleave={() => (dropdownOpen = false)}
				>
					<button
						class="flex items-center space-x-1 border border-white p-2 text-white hover:text-white/80"
						onfocus={() => (dropdownOpen = true)}
						onblur={() => (dropdownOpen = false)}
						bind:this={profileButton}
					>
						<span class="hidden md:inline">{user?.username || 'User'}</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>

					<!-- Dropdown Menu -->
					<div
						role="menu"
						tabindex="0"
						class={`absolute right-0 z-50 w-48 border border-white bg-black shadow-lg ${dropdownOpen ? 'block' : 'hidden'} pt-2`}
						style="top: 100%;"
						onmouseenter={() => (dropdownOpen = true)}
						onmouseleave={() => (dropdownOpen = false)}
						onkeydown={(event) => {
							if (event.key === 'Escape') dropdownOpen = false;
						}}
					>
						<div class="py-1">
							<a href="/dashboard/profile" class="block px-4 py-2 hover:bg-white hover:text-black">
								Profile
							</a>
							<a href="/dashboard/settings" class="block px-4 py-2 hover:bg-white hover:text-black">
								Settings
							</a>
							<form method="post" action="/dashboard?/logout">
								<button
									type="submit"
									class="w-full px-4 py-2 text-left hover:bg-white hover:text-black"
								>
									Sign out
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		</div>
	</nav>

	<!-- Mobile Navigation (shows on small screens) -->
	<div class="border-b border-white md:hidden">
		<div class="flex justify-around">
			<a
				href="/dashboard"
				class="flex-1 py-2 text-center {$page.url.pathname === '/dashboard' ? 'bg-white/10' : ''}"
			>
				Dashboard
			</a>
			<a
				href="/dashboard/organizations"
				class="flex-1 py-2 text-center {$page.url.pathname.startsWith('/dashboard/organizations')
					? 'bg-white/10'
					: ''}"
			>
				Organizations
			</a>
		</div>
	</div>

	<!-- Main Content -->
	<main class="flex-grow">
		<slot />
	</main>
</div>
