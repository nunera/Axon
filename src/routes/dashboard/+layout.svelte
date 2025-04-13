<script lang="ts">
	import { page } from '$app/stores';
	
	// Get user from the parent data
	$: ({ user } = $page.data);
</script>

<div class="min-h-screen bg-black text-white flex flex-col">
	<!-- Navigation Bar -->
	<nav class="bg-black border-b border-white p-4">
		<div class="container mx-auto flex justify-between items-center">
			<div class="flex items-center space-x-6">
				<a href="/dashboard" class="text-xl font-bold">Axon</a>
				
				<div class="hidden md:flex space-x-6">
					<a 
						href="/dashboard" 
						class="hover:text-white/80 {$page.url.pathname === '/dashboard' ? 'border-b-2 border-white' : ''}"
					>
						Dashboard
					</a>
					<a 
						href="/dashboard/organizations" 
						class="hover:text-white/80 {$page.url.pathname.startsWith('/dashboard/organizations') ? 'border-b-2 border-white' : ''}"
					>
						Organizations
					</a>
				</div>
			</div>
			
			<div class="flex items-center">
				<div class="relative group">
					<button 
						class="flex items-center space-x-1 text-white hover:text-white/80 border border-white p-2"
					>
						<span class="hidden md:inline">{user?.username || 'User'}</span>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
							<path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
						</svg>
					</button>
					
					<!-- Dropdown Menu -->
					<div class="absolute right-0 mt-2 w-48 bg-black border border-white shadow-lg hidden group-hover:block">
						<div class="py-1">
							<a href="/dashboard/profile" class="block px-4 py-2 hover:bg-white hover:text-black">
								Profile
							</a>
							<a href="/dashboard/settings" class="block px-4 py-2 hover:bg-white hover:text-black">
								Settings
							</a>
							<form method="post" action="/dashboard?/logout">
								<button type="submit" class="w-full text-left px-4 py-2 hover:bg-white hover:text-black">
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
	<div class="md:hidden border-b border-white">
		<div class="flex justify-around">
			<a 
				href="/dashboard" 
				class="flex-1 py-2 text-center {$page.url.pathname === '/dashboard' ? 'bg-white/10' : ''}"
			>
				Dashboard
			</a>
			<a 
				href="/dashboard/organizations" 
				class="flex-1 py-2 text-center {$page.url.pathname.startsWith('/dashboard/organizations') ? 'bg-white/10' : ''}"
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
