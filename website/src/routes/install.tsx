import type { LoaderFunctionArgs } from 'react-router'
import { generateInstallScript } from '../lib/generate-install-script'

export async function loader({}: LoaderFunctionArgs) {
  const script = await generateInstallScript('remorses/termcast')

  return new Response(script, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
