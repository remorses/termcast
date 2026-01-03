import type { LoaderFunctionArgs } from 'react-router'
import { generateInstallScript } from '../lib/generate-install-script'

export async function loader({ params }: LoaderFunctionArgs) {
  const { owner, repo } = params
  const script = await generateInstallScript(`${owner}/${repo}`)

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
