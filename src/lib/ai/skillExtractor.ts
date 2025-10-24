/**
 * AI-powered skill extraction module for Axon
 *
 * This module provides functionality to extract relevant skills from task descriptions
 * using a lightweight NLP approach. In a production environment, this would be connected
 * to a more sophisticated AI model.
 */

// A dictionary of common technical skills with variations
const SKILL_DICTIONARY: Record<string, string[]> = {
	// Programming Languages
	javascript: ['js', 'javascript', 'es6', 'ecmascript', 'node', 'nodejs'],
	typescript: ['ts', 'typescript', 'typed javascript'],
	python: ['py', 'python', 'python3'],
	java: ['java', 'javase', 'jdk'],
	'c#': ['c#', 'csharp', 'dotnet', '.net', 'dotnetcore'],
	'c++': ['c\\+\\+', 'cpp'],
	php: ['php', 'php7', 'php8'],
	ruby: ['ruby', 'rails', 'ruby on rails'],
	swift: ['swift', 'ios development'],
	kotlin: ['kotlin', 'android development'],
	rust: ['rust', 'rustlang'],
	go: ['go', 'golang'],

	// Frontend
	html: ['html', 'html5'],
	css: ['css', 'css3', 'scss', 'sass', 'less', 'stylesheets'],
	react: ['react', 'reactjs', 'react.js', 'jsx'],
	vue: ['vue', 'vuejs', 'vue.js', 'vuex'],
	angular: ['angular', 'ng', 'angularjs'],
	svelte: ['svelte', 'sveltejs', 'sveltekit'],
	tailwind: ['tailwind', 'tailwindcss', 'tailwind css'],

	// Backend
	'node.js': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
	django: ['django', 'django rest framework', 'drf'],
	flask: ['flask'],
	spring: ['spring', 'spring boot', 'springboot'],
	laravel: ['laravel', 'laravel framework'],
	fastapi: ['fastapi', 'fast api'],

	// Databases
	sql: ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sqlite'],
	nosql: ['nosql', 'mongodb', 'mongo', 'dynamodb', 'cosmosdb', 'firestore'],
	graphql: ['graphql', 'gql'],

	// DevOps
	docker: ['docker', 'container', 'containerization'],
	kubernetes: ['kubernetes', 'k8s', 'kubectl'],
	aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront'],
	azure: ['azure', 'microsoft azure'],
	gcp: ['gcp', 'google cloud', 'google cloud platform'],
	'ci/cd': [
		'ci/cd',
		'ci',
		'cd',
		'continuous integration',
		'continuous deployment',
		'jenkins',
		'github actions',
		'gitlab ci'
	],

	// Design
	ui: ['ui', 'user interface', 'interface design'],
	ux: ['ux', 'user experience', 'usability'],
	figma: ['figma', 'design', 'prototyping'],
	photoshop: ['photoshop', 'ps', 'adobe photoshop'],

	// Soft Skills
	communication: ['communication', 'communicate', 'explaining', 'documentation'],
	leadership: ['leadership', 'lead', 'leading', 'management'],
	teamwork: ['teamwork', 'team player', 'collaboration', 'collaborative'],
	'problem-solving': ['problem-solving', 'troubleshooting', 'debugging', 'problem solver']
};

/**
 * Extracts skills from a task description using pattern matching and a predefined dictionary
 *
 * @param title - The task title
 * @param description - The task description (optional)
 * @returns Array of skill identifiers
 */
export function extractSkillsFromTask(title: string, description?: string): string[] {
	// Combine title and description for analysis
	const content = `${title} ${description || ''}`.toLowerCase();

	// Extract skills based on the dictionary
	const foundSkills = new Set<string>();

	for (const [skillName, variations] of Object.entries(SKILL_DICTIONARY)) {
		for (const variation of variations) {
			// Match whole words only with word boundary \b
			const regex = new RegExp(`\\b${variation}\\b`, 'i');

			if (regex.test(content)) {
				foundSkills.add(skillName);
				break; // Skip further variations once we find a match
			}
		}
	}

	return Array.from(foundSkills);
}

/**
 * Get skill suggestions based on task description and available skills in the database
 *
 * @param title - The task title
 * @param description - The task description
 * @param availableSkills - List of available skills from the database
 * @returns Array of suggested skill IDs
 */
export function suggestSkills(
	title: string,
	description: string | null,
	availableSkills: Array<{ id: number; name: string; category?: string | null }>
): number[] {
	const extractedSkills = extractSkillsFromTask(title, description || undefined);

	// Match extracted skills with available skills in the database
	const matchedSkillIds = availableSkills
		.filter((skill) => {
			// Direct match
			if (extractedSkills.includes(skill.name.toLowerCase())) {
				return true;
			}

			// Check for partial matches in extracted skills
			return extractedSkills.some((extractedSkill) => {
				return (
					skill.name.toLowerCase().includes(extractedSkill) ||
					extractedSkill.includes(skill.name.toLowerCase())
				);
			});
		})
		.map((skill) => skill.id);

	return matchedSkillIds;
}

/**
 * Recommend users for a task based on required skills
 *
 * @param taskSkills - Array of skill IDs required for the task
 * @param userSkills - Map of user IDs to their skills with proficiency
 * @returns Array of user IDs sorted by match score
 */
export function recommendUsersForTask(
	taskSkills: number[],
	userSkills: Record<string, Array<{ skillId: number; proficiency?: number | null }>>
): string[] {
	// Calculate match scores
	const userScores: [string, number][] = Object.entries(userSkills).map(([userId, skills]) => {
		const matchingSkills = skills.filter((skill) => taskSkills.includes(skill.skillId));

		let score = 0;
		for (const match of matchingSkills) {
			// Base score for having the skill
			score += 10;

			// Additional points for proficiency (if available)
			if (match.proficiency) {
				score += match.proficiency * 2; // Scale factor for proficiency
			}
		}

		return [userId, score];
	});

	// Sort by score (descending) and extract user IDs
	return userScores
		.sort((a, b) => b[1] - a[1]) // Sort by score
		.filter(([, score]) => score > 0) // Only include users with matching skills
		.map(([userId]) => userId);
}
