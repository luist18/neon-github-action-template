import * as core from '@actions/core'

import { listProjects } from './list.js'

const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/i

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Required input fields
    const apiKey: string = core.getInput('api_key', {
      required: true,
      trimWhitespace: true
    })

    // Optional fields but with default value
    const apiHost: string = core.getInput('api_host', { trimWhitespace: true }) // defaults to https://console.neon.tech/api/v2

    if (!urlRegex.test(apiHost)) {
      throw new Error('API host must be a valid URL')
    }

    // List projects
    const projects = await listProjects(apiKey, apiHost)

    // Output the projects
    core.setOutput(
      'projects',
      projects.map((project) => project.name).join(', ')
    )
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
