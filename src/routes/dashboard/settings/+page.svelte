<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { browser } from '$app/environment';
	import type { PageData } from './$types';

	type Feedback = { type: 'success' | 'error'; message: string };
	type LocalAiConfig = {
		provider: string;
		model: string;
		customModelName: string;
		customBaseUrl: string;
		apiKey: string;
	};

	const LOCAL_STORAGE_KEY = 'axon:ai-config';

	const providerOptions = [
		{ value: 'openai', label: 'OpenAI' },
		{ value: 'anthropic', label: 'Anthropic (Claude)' },
		{ value: 'google', label: 'Google Gemini' },
		{ value: 'mistral', label: 'Mistral AI' },
		{ value: 'openai-compatible', label: 'OpenAI-Compatible API' }
	];

	const presetModelsByProvider: Record<string, string[]> = {
		openai: ['gpt-4.1', 'gpt-4o-mini', 'gpt-3.5-turbo'],
		anthropic: ['claude-3.5-sonnet', 'claude-3-opus'],
		google: ['gemini-1.5-pro', 'gemini-1.5-flash'],
		mistral: ['mistral-large-latest', 'mistral-small-latest'],
		'openai-compatible': []
	};

	let { data }: { data: PageData } = $props();

	let hasPassword = $state(data.hasPassword);

	let selectedProvider = $state(providerOptions[0].value);
	let selectedModel = $state('');
	let customModelName = $state('');
	let customBaseUrl = $state('');
	let apiKey = $state('');

	let modelOptions = $state<string[]>(presetModelsByProvider[selectedProvider] ?? []);
	let aiFeedback = $state<Feedback | null>(null);
	let passwordFeedback = $state<Feedback | null>(null);

	if (browser) {
		try {
			const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
			if (stored) {
				const parsed = JSON.parse(stored) as Partial<LocalAiConfig>;
				selectedProvider =
					parsed.provider && providerOptions.some((p) => p.value === parsed.provider)
						? parsed.provider
						: providerOptions[0].value;
				selectedModel = typeof parsed.model === 'string' ? parsed.model : '';
				customModelName = typeof parsed.customModelName === 'string' ? parsed.customModelName : '';
				customBaseUrl = typeof parsed.customBaseUrl === 'string' ? parsed.customBaseUrl : '';
				apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey : '';
			}
		} catch (error) {
			console.warn('Unable to parse stored AI config', error);
		}
	}

	$effect(() => {
		modelOptions = presetModelsByProvider[selectedProvider] ?? [];
		if (selectedModel && selectedModel !== 'custom') {
			const isValidPreset = modelOptions.includes(selectedModel);
			if (!isValidPreset) {
				selectedModel = '';
			}
		}
	});

	function failureMessage(result: { data?: unknown; error?: Error }, fallback: string) {
		if (result.data && typeof result.data === 'object' && 'message' in result.data) {
			const message = (result.data as { message: unknown }).message;
			if (typeof message === 'string') return message;
		}
		if (result.error?.message) {
			return result.error.message;
		}
		return fallback;
	}

	const handlePasswordForm: SubmitFunction = async ({ result, update, form }) => {
		if (result.type === 'success') {
			await update();
			form?.reset();
			passwordFeedback = {
				type: 'success',
				message: hasPassword ? 'Password updated.' : 'Password created.'
			};
			hasPassword = true;
		} else if (result.type === 'failure') {
			await update();
			passwordFeedback = {
				type: 'error',
				message: failureMessage(result, 'Unable to update password.')
			};
		} else if (result.type === 'error') {
			passwordFeedback = {
				type: 'error',
				message: failureMessage(result, 'Unable to update password.')
			};
		}
	};

	function saveAiConfig() {
		if (!browser) return;
		const config: LocalAiConfig = {
			provider: selectedProvider,
			model: selectedModel,
			customModelName,
			customBaseUrl,
			apiKey
		};

		try {
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
			aiFeedback = { type: 'success', message: 'AI assistant configuration saved locally.' };
		} catch (error) {
			console.error('Failed to save AI configuration', error);
			aiFeedback = {
				type: 'error',
				message: 'Unable to save configuration. Please check your browser storage settings.'
			};
		}
	}
</script>

<div class="container mx-auto px-4 py-8">
	<div class="mx-auto max-w-3xl space-y-8">
		<h1 class="text-3xl font-bold">Settings</h1>

		<section class="border border-white bg-black p-6">
			<h2 class="mb-4 text-xl font-bold">Account Security</h2>
			<form
				method="post"
				action="?/changePassword"
				use:enhance={handlePasswordForm}
				class="space-y-4"
			>
				{#if hasPassword}
					<div>
						<label for="currentPassword" class="mb-1 block text-sm font-medium text-white">
							Current Password
						</label>
						<input
							id="currentPassword"
							name="currentPassword"
							type="password"
							required
							autocomplete="current-password"
							class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
						/>
					</div>
				{/if}
				<div>
					<label for="newPassword" class="mb-1 block text-sm font-medium text-white"
						>New Password</label
					>
					<input
						id="newPassword"
						name="newPassword"
						type="password"
						required
						autocomplete="new-password"
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					/>
				</div>
				<div>
					<label for="confirmPassword" class="mb-1 block text-sm font-medium text-white">
						Confirm Password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						autocomplete="new-password"
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					/>
				</div>
				<button
					type="submit"
					class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
				>
					{hasPassword ? 'Update Password' : 'Set Password'}
				</button>
				{#if passwordFeedback}
					<p
						class={`text-sm ${passwordFeedback.type === 'success' ? 'text-green-300' : 'text-red-300'} mt-2`}
					>
						{passwordFeedback.message}
					</p>
				{/if}
			</form>
		</section>

		<section class="border border-white bg-black p-6">
			<h2 class="mb-2 text-xl font-bold">AI Assistant Configuration</h2>
			<p class="mb-6 text-sm text-gray-400">
				Selections are stored securely in your browser. The app will use these values when
				client-side AI features are enabled.
			</p>

			<div class="space-y-4">
				<div>
					<label for="provider" class="mb-1 block text-sm font-medium text-white">Provider</label>
					<select
						id="provider"
						name="provider"
						bind:value={selectedProvider}
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					>
						{#each providerOptions as option (option.value)}
							<option value={option.value}>{option.label}</option>
						{/each}
					</select>
				</div>

				{#if selectedProvider === 'openai-compatible'}
					<div>
						<label for="customBaseUrl" class="mb-1 block text-sm font-medium text-white">
							Custom Base URL
						</label>
						<input
							id="customBaseUrl"
							name="customBaseUrl"
							type="url"
							bind:value={customBaseUrl}
							placeholder="https://api.your-provider.com"
							class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
						/>
					</div>
				{/if}

				<div>
					<label for="model" class="mb-1 block text-sm font-medium text-white">Model</label>
					<select
						id="model"
						name="model"
						bind:value={selectedModel}
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					>
						<option value="">Use provider default</option>
						{#each modelOptions as model (model)}
							<option value={model}>{model}</option>
						{/each}
						<option value="custom">Custom model</option>
					</select>
				</div>

				{#if selectedModel === 'custom'}
					<div>
						<label for="customModelName" class="mb-1 block text-sm font-medium text-white">
							Model name
						</label>
						<input
							id="customModelName"
							name="customModelName"
							bind:value={customModelName}
							placeholder="e.g. my-internal-model"
							class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
						/>
					</div>
				{/if}

				<div>
					<label for="apiKey" class="mb-1 block text-sm font-medium text-white">API key</label>
					<input
						id="apiKey"
						name="apiKey"
						type="password"
						bind:value={apiKey}
						placeholder="Enter your API key"
						class="w-full border border-white bg-black px-3 py-2 text-white focus:ring-2 focus:ring-white focus:outline-none"
					/>
					<p class="mt-2 text-xs text-gray-400">
						Stored locally in this browser. Clearing site data will remove it.
					</p>
				</div>

				<button
					type="button"
					onclick={saveAiConfig}
					class="border-2 border-white bg-black px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-black"
				>
					Save Configuration
				</button>

				{#if aiFeedback}
					<p class={`text-sm ${aiFeedback.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
						{aiFeedback.message}
					</p>
				{/if}
			</div>
		</section>
	</div>
</div>
