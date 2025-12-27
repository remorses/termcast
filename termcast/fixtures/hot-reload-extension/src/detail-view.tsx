



import { Detail } from '@raycast/api'

const detailMarkdown = `
# Build TUIs with hot module replacement

made with termcast.app and opentui

powered by **React Refresh**!

> this is new content

> added via HMR without restarting the process!


`;


export default function DetailView() {
  return <Detail markdown={detailMarkdown} />
}
