import { List } from '@raycast/api'

// This error is thrown at module/root scope (when the module is imported)
throw new Error('This is a test error thrown at root scope')

export default function ThrowErrorCommand() {
  return (
    <List navigationTitle='Throw Error'>
      <List.Item title='This should never render' />
    </List>
  )
}
