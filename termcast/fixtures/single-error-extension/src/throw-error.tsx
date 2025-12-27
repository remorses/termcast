import { List } from '@raycast/api'

// This error is thrown at module/root scope
throw new Error('Single command root error')

export default function ThrowErrorCommand() {
  return (
    <List navigationTitle='Throw Error'>
      <List.Item title='This should never render' />
    </List>
  )
}
