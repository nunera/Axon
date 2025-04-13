const SKILL_DICTIONARY: Record<string, string[]> = {
  
  'javascript': ['js', 'javascript', 'es6', 'ecmascript', 'node', 'nodejs'],
  'typescript': ['ts', 'typescript', 'typed javascript'],
  'python': ['py', 'python', 'python3'],
  'java': ['java', 'javase', 'jdk'],
  'c#': ['c#', 'csharp', 'dotnet', '.net', 'dotnetcore'],
  'c++': ['c\\+\\+', 'cpp'],
  'php': ['php', 'php7', 'php8'],
  'ruby': ['ruby', 'rails', 'ruby on rails'],
  'swift': ['swift', 'ios development'],
  'kotlin': ['kotlin', 'android development'],
  'rust': ['rust', 'rustlang'],
  'go': ['go', 'golang'],
  
  
  'html': ['html', 'html5'],
  'css': ['css', 'css3', 'scss', 'sass', 'less', 'stylesheets'],
  'react': ['react', 'reactjs', 'react.js', 'jsx'],
  'vue': ['vue', 'vuejs', 'vue.js', 'vuex'],
  'angular': ['angular', 'ng', 'angularjs'],
  'svelte': ['svelte', 'sveltejs', 'sveltekit'],
  'tailwind': ['tailwind', 'tailwindcss', 'tailwind css'],
  
  
  'node.js': ['node', 'nodejs', 'node.js', 'express', 'expressjs'],
  'django': ['django', 'django rest framework', 'drf'],
  'flask': ['flask'],
  'spring': ['spring', 'spring boot', 'springboot'],
  'laravel': ['laravel', 'laravel framework'],
  'fastapi': ['fastapi', 'fast api'],
  
  
  'sql': ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sqlite'],
  'nosql': ['nosql', 'mongodb', 'mongo', 'dynamodb', 'cosmosdb', 'firestore'],
  'graphql': ['graphql', 'gql'],
  
  
  'docker': ['docker', 'container', 'containerization'],
  'kubernetes': ['kubernetes', 'k8s', 'kubectl'],
  'aws': ['aws', 'amazon web services', 'ec2', 's3', 'lambda', 'cloudfront'],
  'azure': ['azure', 'microsoft azure'],
  'gcp': ['gcp', 'google cloud', 'google cloud platform'],
  'ci/cd': ['ci/cd', 'ci', 'cd', 'continuous integration', 'continuous deployment', 'jenkins', 'github actions', 'gitlab ci'],
  
  
  'ui': ['ui', 'user interface', 'interface design'],
  'ux': ['ux', 'user experience', 'usability'],
  'figma': ['figma', 'design', 'prototyping'],
  'photoshop': ['photoshop', 'ps', 'adobe photoshop'],
  
  
  'communication': ['communication', 'communicate', 'explaining', 'documentation'],
  'leadership': ['leadership', 'lead', 'leading', 'management'],
  'teamwork': ['teamwork', 'team player', 'collaboration', 'collaborative'],
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
  
  const content = `${title} ${description || ''}`.toLowerCase();
  
  
  const foundSkills = new Set<string>();
  
  for (const [skillName, variations] of Object.entries(SKILL_DICTIONARY)) {
    for (const variation of variations) {
      
      const regex = new RegExp(`\\b${variation}\\b`, 'i');
      
      if (regex.test(content)) {
        foundSkills.add(skillName);
        break; 
      }
    }
  }
  
  return Array.from(foundSkills);
}

export function suggestSkills(
  title: string, 
  description: string | null, 
  availableSkills: Array<{ id: number; name: string; category?: string | null }>
): number[] {
  const extractedSkills = extractSkillsFromTask(title, description || undefined);
  
  
  const matchedSkillIds = availableSkills
    .filter(skill => {
      
      if (extractedSkills.includes(skill.name.toLowerCase())) {
        return true;
      }
      
      
      return extractedSkills.some(extractedSkill => {
        return skill.name.toLowerCase().includes(extractedSkill) || 
               extractedSkill.includes(skill.name.toLowerCase());
      });
    })
    .map(skill => skill.id);
  
  return matchedSkillIds;
}

export function recommendUsersForTask(
  taskSkills: number[],
  userSkills: Record<string, Array<{ skillId: number; proficiency?: number | null }>>
): string[] {
  
  const userScores: [string, number][] = Object.entries(userSkills).map(([userId, skills]) => {
    const matchingSkills = skills.filter(skill => taskSkills.includes(skill.skillId));
    
    let score = 0;
    for (const match of matchingSkills) {
      
      score += 10;
      
      
      if (match.proficiency) {
        score += match.proficiency * 2; 
      }
    }
    
    return [userId, score];
  });
  
  
  return userScores
    .sort((a, b) => b[1] - a[1]) 
    .filter(([, score]) => score > 0) 
    .map(([userId]) => userId);
}
