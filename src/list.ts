import { createApiClient, ProjectListItem } from '@neondatabase/api-client'

import { version } from './version.js'

export async function listProjects(
  apiKey: string,
  apiHost: string
): Promise<ProjectListItem[]> {
  const client = createApiClient({
    apiKey,
    baseURL: apiHost,
    timeout: 60000,
    headers: {
      // action version from the package.json
      'User-Agent': `neon-github-action-template v${version}`
    }
  })

  // Get all projects
  const projects = await client.listProjects({
    limit: 10
  })
  if (projects.status !== 200) {
    throw new Error(`Failed to list projects`)
  }

  return projects.data?.projects || []
}
