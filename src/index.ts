import * as core from '@actions/core'
import { HttpClient } from '@actions/http-client'
import { updateLanguagesMetadata } from './utils'

async function main() {
  try {
    const tolgee_secret = core.getInput('tolgee_secret', { required: true, trimWhitespace: true })

    await updateLanguagesMetadata(new HttpClient('GitHub Actions (VueTorrent/VueTorrent)'), tolgee_secret)
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

main()