/**
 * Test file for defaultSearchQuery prop
 */
import { renderWithProviders } from '../../utils'
import { CustomList } from './custom-renderable-list'

const ITEMS = [
  { title: 'Apple', subtitle: 'Red fruit' },
  { title: 'Banana', subtitle: 'Yellow fruit' },
  { title: 'Cherry', subtitle: 'Small red fruit' },
]

function Test() {
  return (
    <box flexDirection="column" padding={1} flexGrow={1}>
      <text marginBottom={1}>Default Search Test</text>
      <CustomList defaultSearchQuery="banana">
        {ITEMS.map((item) => (
          <CustomList.Item key={item.title} title={item.title} subtitle={item.subtitle} />
        ))}
      </CustomList>
    </box>
  )
}

renderWithProviders(<Test />)
