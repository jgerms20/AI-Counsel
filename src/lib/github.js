import { getSettings } from './settings.js'

function headers() {
  const { githubPat } = getSettings()
  return {
    Authorization: `Bearer ${githubPat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function dispatchWorkflow({ topic, audioMethod, runLabel }) {
  const { repo } = getSettings()
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/workflows/podcast-workflow.yml/dispatches`,
    {
      method: 'POST',
      headers: { ...headers(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref: 'main',
        inputs: { topic, audio_method: audioMethod, run_id_label: runLabel },
      }),
    }
  )
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Dispatch failed (${res.status}): ${text}`)
  }
}

export async function getLatestRunForLabel(runLabel) {
  const { repo } = getSettings()
  // Give Actions a moment to register the run
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/runs?per_page=10`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`Failed to list runs: ${res.status}`)
  const data = await res.json()
  return data.workflow_runs?.find(r =>
    r.name?.includes('Podcast') && ['queued', 'in_progress', 'completed'].includes(r.status)
  ) || null
}

export async function getRunStatus(runId) {
  const { repo } = getSettings()
  const res = await fetch(
    `https://api.github.com/repos/${repo}/actions/runs/${runId}/jobs`,
    { headers: headers() }
  )
  if (!res.ok) throw new Error(`Failed to get run jobs: ${res.status}`)
  return res.json()
}

export async function fetchResultFile(runLabel, filename) {
  const { repo } = getSettings()
  const [owner, repoName] = repo.split('/')
  const url = `https://raw.githubusercontent.com/${owner}/${repoName}/main/results/${runLabel}/${filename}`
  const res = await fetch(url + `?t=${Date.now()}`)
  if (!res.ok) throw new Error(`File not found: ${filename}`)
  return filename.endsWith('.json') ? res.json() : res.text()
}
