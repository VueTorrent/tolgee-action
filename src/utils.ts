import * as core from '@actions/core'
import { HttpClient } from '@actions/http-client'
import { mkdirP } from '@actions/io'
import * as fs from 'fs'
import { LanguageResponse } from './types'

const languages_url = `https://app.tolgee.io/v2/projects/languages`

async function extractProjectLanguages(httpClient: HttpClient, api_key: string) {
  const r_lang = await httpClient.getJson<LanguageResponse>(languages_url, {
    'X-API-KEY': api_key
  })
  core.debug(JSON.stringify(r_lang.result))

  if (r_lang.statusCode !== 200 || !r_lang.result) throw new Error(`HTTP request failed. Received: ${ r_lang.statusCode }`)

  const projectLocales = r_lang.result._embedded.languages
  return projectLocales.map(locale_metadata => ({
    importSymbol: locale_metadata.tag.toLowerCase().replace('-', '_'),
    enumName: locale_metadata.tag.toUpperCase().replace('-', '_'),
    tag: locale_metadata.tag,
    originalName: locale_metadata.originalName
  }))
  .filter(v => fs.existsSync(`./src/locales/${v.importSymbol}.json`))
  .sort((a, b) => a.tag.localeCompare(b.tag))
}

export async function updateLanguagesMetadata(httpClient: HttpClient, api_key: string) {
  const metadata = await extractProjectLanguages(httpClient, api_key)
  let generated = ''

  // import statements
  metadata.forEach(lang => (generated += `import ${ lang.importSymbol } from './${ lang.tag }.json'\n`))

  // typedefs
  generated += '\ntype LocaleDef = { title: string; value: Locales }\n\n'

  // locales enum
  generated += 'export enum Locales {\n'
  metadata.forEach(lang => (generated += `  ${ lang.enumName } = '${ lang.tag }',\n`))
  generated += '}\n\n'

  // locales def
  generated += 'export const LOCALES: LocaleDef[] = [\n'
  metadata.forEach(lang => (generated += `  { title: '${ lang.originalName }', value: Locales.${ lang.enumName } },\n`))
  generated += ']\n\n'

  // i18n messages
  generated += 'export const messages: Record<Locales, any> = {\n'
  metadata.forEach(lang => (generated += `  [Locales.${ lang.enumName }]: ${ lang.importSymbol },\n`))
  generated += '}\n\nexport const defaultLocale = Locales.EN\nexport const fallbackLocale = Locales.EN\n'

  await mkdirP('./src/locales')
  fs.writeFileSync('./src/locales/index.ts', generated)
  core.debug(generated)
}