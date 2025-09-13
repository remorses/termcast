import {
  renderWithProviders,
  Detail,
  Action,
  ActionPanel,
  showToast,
  Toast,
} from '@termcast/cli';
import List from '@termcast/cli';
import { useNavigation } from '@termcast/cli/src/internal/navigation';
import dedent from 'string-dedent';

function SimpleListExample() {
  const { push } = useNavigation();
  return (
    <List
      navigationTitle="Simple List Example"
      searchBarPlaceholder="Search items..."
      onSelectionChange={(id) => {
        console.log('Selected:', id);
      }}
    >
      <List.Section title="Empty section should be hidden">
        {/* This section is intentionally left empty to demonstrate hiding */}
      </List.Section>
      <List.Section title="Fruits">
        <List.Item
          id="apple"
          title="Apple"
          subtitle="Red and sweet"
          keywords={['fruit', 'red']}
          accessories={[{ text: 'Fresh' }, { tag: 'Popular' }]}
          actions={
            <ActionPanel>
              <Action
                title="View Details"
                onAction={() =>
                  push(
                    <Detail
                      markdown={dedent`
                        # Apple

                        A delicious red fruit that's sweet and crunchy.

                        ## Nutrition Facts
                        - High in fiber
                        - Rich in antioxidants
                        - Good source of vitamin C
                      `}
                    />
                  )
                }
              />
              <Action
                title="Add to Cart"
                onAction={() => {
                  showToast({
                    style: Toast.Style.Success,
                    title: 'Added to Cart',
                    message: 'Apple has been added to your cart',
                  });
                }}
              />
            </ActionPanel>
          }
        />
        <List.Item
          id="banana"
          title="Banana"
          subtitle="Yellow and nutritious"
          keywords={['fruit', 'yellow']}
          accessories={[{ text: 'Ripe' }]}
          actions={
            <ActionPanel>
              <Action
                title="View Details"
                onAction={() =>
                  push(
                    <Detail
                      markdown={dedent`
                        # Banana

                        A yellow tropical fruit that's nutritious and energy-rich.

                        ## Benefits
                        - High in potassium
                        - Natural energy booster
                        - Aids digestion
                      `}
                    />
                  )
                }
              />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Section title="Vegetables">
        <List.Item
          id="carrot"
          title="Carrot"
          subtitle="Orange and crunchy"
          keywords={['vegetable', 'orange']}
          accessories={[{ tag: 'Healthy' }]}
          actions={
            <ActionPanel>
              <Action
                title="View Details"
                onAction={() =>
                  push(
                    <Detail
                      markdown={dedent`
                        # Carrot

                        A crunchy orange vegetable rich in vitamins.

                        ## Health Benefits
                        - Excellent source of beta carotene
                        - Improves eye health
                        - Boosts immune system
                        - Low in calories
                      `}
                    />
                  )
                }
              />
            </ActionPanel>
          }
        />
        <List.Item
          id="lettuce"
          title="Lettuce"
          subtitle="Green and fresh"
          keywords={['vegetable', 'green', 'salad']}
          actions={
            <ActionPanel>
              <Action
                title="View Details"
                onAction={() =>
                  push(
                    <Detail
                      markdown={dedent`
                        # Lettuce

                        Fresh green leafy vegetable perfect for salads.

                        ## Nutritional Value
                        - High in water content
                        - Low in calories
                        - Contains folate and vitamin K
                        - Good source of fiber
                      `}
                    />
                  )
                }
              />
            </ActionPanel>
          }
        />
      </List.Section>
      <List.Item
        id="bread"
        title="Bread"
        subtitle="Freshly baked"
        keywords={['bakery']}
        accessories={[{ text: 'Today' }, { tag: 'New' }]}
        actions={
          <ActionPanel>
            <Action
              title="View Details"
              onAction={() =>
                push(
                  <Detail
                    markdown={dedent`
                      # Bread

                      Freshly baked bread from our bakery.

                      ## Product Details
                      - Baked fresh daily
                      - Made with organic flour
                      - No preservatives
                      - Perfect for sandwiches or toast
                    `}
                  />
                )
              }
            />
          </ActionPanel>
        }
      />
    </List>
  );
}

renderWithProviders(<SimpleListExample />);
