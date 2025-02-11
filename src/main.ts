import * as core from '@actions/core'

import { diff, summary, upsertGitHubComment } from './diff.js'
import { getBranchInput, getPointInTime } from './utils.js'

const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/i

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    // Required input fields
    const githubToken = core.getInput('github-token', { required: true })
    const projectId: string = core.getInput('project_id', {
      required: true,
      trimWhitespace: true
    })
    const compareBranchIdentifier: string = core.getInput('compare_branch', {
      required: true,
      trimWhitespace: true
    })
    const baseBranchIdentifier: string = core.getInput('base_branch', {
      required: false,
      trimWhitespace: true
    })
    const apiKey: string = core.getInput('api_key', {
      required: true,
      trimWhitespace: true
    })

    // Optional fields but with default value
    const apiHost: string = core.getInput('api_host', { trimWhitespace: true }) // defaults to https://console.neon.tech/api/v2
    const database: string = core.getInput('database', { trimWhitespace: true }) // defaults to neondb

    // Optional fields without default values
    const timestamp: string = core.getInput('timestamp', {
      trimWhitespace: true
    })
    const lsn: string = core.getInput('lsn', { trimWhitespace: true })

    // Check if the API host is a valid URL
    if (!urlRegex.test(apiHost)) {
      throw new Error('API host must be a valid URL')
    }

    // Check if the database is valid, i.e. not empty
    if (!database) {
      throw new Error('Database name cannot be empty')
    }

    // Get the point in time for the schema diff
    const pointInTime = getPointInTime(timestamp, lsn)

    const branchInput = getBranchInput(
      compareBranchIdentifier,
      baseBranchIdentifier
    )

    // Get the diff, summary and comment URL
    const { sql, hash, compareBranch, baseBranch } = await diff(
      projectId,
      branchInput,
      apiKey,
      apiHost,
      database,
      pointInTime
    )

    const markdown = summary(
      sql,
      hash,
      compareBranch,
      baseBranch,
      database,
      projectId
    )

    core.setOutput('diff', sql)

    if (process.env.ENVIRONMENT === 'development') {
      core.info('Skipping comment creation in development environment')
      return
    }

    const { url, operation } = await upsertGitHubComment(
      githubToken,
      markdown,
      hash
    )

    if (operation === 'noop') {
      core.info('No changes detected in the schema diff')
    } else {
      core.info(`Comment ${operation} successfully`)
    }

    if (url) {
      core.setOutput('comment_url', url)

      core.info(`Comment URL: ${url}`)
    }
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
