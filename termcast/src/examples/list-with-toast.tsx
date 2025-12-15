import { renderWithProviders, List, showToast, Toast } from 'termcast'

const items = [
  { id: '1', title: 'First Item' },
  { id: '2', title: 'Second Item' },
  { id: '3', title: 'Third Item' },
  { id: '4', title: 'Fourth Item' },
  { id: '5', title: 'Fifth Item' },
]

function ListWithToast() {
  const handleSelectionChange = async (id: string | null) => {
    if (id) {
      const item = items.find((i) => i.id === id)
      await showToast({
        style: Toast.Style.Success,
        title: 'Selected',
        message: item?.title,
      })
    }
  }

  return (
    <List
      navigationTitle='List With Toast'
      onSelectionChange={handleSelectionChange}
    >
      {items.map((item) => (
        <List.Item key={item.id} id={item.id} title={item.title} />
      ))}
    </List>
  )
}

await renderWithProviders(<ListWithToast />)
