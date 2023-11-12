import * as core from '@actions/core'
import { exec } from '@actions/exec'
import { HttpClient } from '@actions/http-client'
import { which } from '@actions/io'
import { rm } from '@actions/io/lib/io-util'
import { LanguageResponse } from './types'

const base_url = 'https://app.tolgee.io/v2'
const languages_url = `${ base_url }/projects/languages`
const export_url = `${ base_url }/projects/export`

async function extractLanguages(httpClient: HttpClient, api_key: string) {
  const r_lang = await httpClient.getJson<LanguageResponse>(languages_url, {
    'X-API-KEY': api_key
  })
  core.debug(JSON.stringify(r_lang.result))

  if (r_lang.statusCode !== 200 || !r_lang.result) throw new Error(`HTTP request failed. Received: ${ r_lang.statusCode }`)

  const projectLocales = r_lang.result[0]
  return projectLocales.map(locale_metadata => ({
    tag: locale_metadata.tag,
    originalName: locale_metadata.originalName
  }))
}

async function exportLocaleData(api_key: string) {
  const curlPath = await which('curl', true)
  const unzipPath = await which('unzip', true)

  await exec(curlPath, ['-H', `X-API-KEY: ${api_key}`, export_url, '-o', 'locales.zip'])
  await exec(unzipPath, ['-o', '-d', './src/locales', 'locales.zip'])
  await rm('locales.zip')
}

async function commitChanges(commit_message: string) {
  const gitPath = await which('git', true)
  await exec(gitPath, ['status'])
  // await exec(gitPath, ['add', '.'])
  // await exec(gitPath, ['commit', '-m', commit_message])
}

async function main() {
  try {
    const tolgee_secret = core.getInput('tolgee-secret', { required: true, trimWhitespace: true })
    const httpClient = new HttpClient('VueTorrent GitHub Actions workflow')

    core.debug('Extracting languages')
    core.info(JSON.stringify(await extractLanguages(httpClient, tolgee_secret)))
    core.debug('Exporting locale data to ./src/locales')
    core.info(JSON.stringify(await exportLocaleData(tolgee_secret)))
    core.debug('Committing changes to repo')
    await commitChanges('chore(localization): Update locales')
  } catch (error: any) {
    core.setFailed(error.message)
  }
}

main()