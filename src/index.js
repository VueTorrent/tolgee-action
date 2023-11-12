const core = require('@actions/core')
const github = require('@actions/github')

async function main() {
  try {
    const tolgee_secret = core.getInput('tolgee-secret', { required: true, trimWhitespace: true })
    core.info(tolgee_secret)
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()