import { render } from '@opentui/react'
import List from '../list'

function ListExample() {
  const handleSelectionChange = (id: string | null) => {
    console.log('Selected item:', id)
  }

  return (
    <List onSelectionChange={handleSelectionChange}>
      <List.Item 
        title="First Item"
        subtitle="This is a subtitle"
        accessories={[
          { text: "Badge" }
        ]}
      />
      
      <List.Item 
        title="Second Item"
        subtitle="Another subtitle"
        accessories={[
          { text: "Important" }
        ]}
      />
      
      <List.Item 
        title="Third Item"
        accessories={[
          { text: "Starred" },
          { text: "Multiple accessories" }
        ]}
      />
      
      <List.Item 
        title="Fourth Item"
        subtitle="This item is searchable"
      />
      
      <List.Item 
        title="Simple Item"
      />
    </List>
  )
}

render(<ListExample />)