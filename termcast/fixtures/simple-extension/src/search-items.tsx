import { List, ActionPanel, Action, Icon } from "@raycast/api";
import { useState } from "react";

interface Item {
  id: string;
  title: string;
  subtitle: string;
  category: string;
}

export default function SearchItems() {
  const [searchText, setSearchText] = useState("");

  const allItems: Item[] = [
    { id: "1", title: "Apple", subtitle: "A red fruit", category: "Fruits" },
    { id: "2", title: "Banana", subtitle: "A yellow fruit", category: "Fruits" },
    { id: "3", title: "Carrot", subtitle: "An orange vegetable", category: "Vegetables" },
    { id: "4", title: "Broccoli", subtitle: "A green vegetable", category: "Vegetables" },
    { id: "5", title: "Chicken", subtitle: "A type of meat", category: "Meat" },
    { id: "6", title: "Beef", subtitle: "Another type of meat", category: "Meat" },
    { id: "7", title: "Orange", subtitle: "A citrus fruit", category: "Fruits" },
    { id: "8", title: "Lettuce", subtitle: "A leafy vegetable", category: "Vegetables" },
  ];

  const filteredItems = searchText
    ? allItems.filter(item =>
        item.title.toLowerCase().includes(searchText.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchText.toLowerCase()) ||
        item.category.toLowerCase().includes(searchText.toLowerCase())
      )
    : allItems;

  const categories = Array.from(new Set(filteredItems.map(item => item.category)));

  return (
    <List
      navigationTitle="Search Items"
      searchBarPlaceholder="Search for items..."
      onSearchTextChange={setSearchText}
      throttle
    >
      {categories.map(category => (
        <List.Section key={category} title={category}>
          {filteredItems
            .filter(item => item.category === category)
            .map((item) => (
              <List.Item
                key={item.id}
                id={item.id}
                title={item.title}
                subtitle={item.subtitle}
                icon={Icon.Star}
                accessories={[{ text: item.category }]}
                actions={
                  <ActionPanel>
                    <Action.CopyToClipboard
                      title="Copy Item Details"
                      content={`${item.title} - ${item.subtitle}`}
                    />
                    <Action.ShowInFinder
                      title="Show Example"
                      path="/tmp"
                    />
                  </ActionPanel>
                }
              />
            ))}
        </List.Section>
      ))}

      {filteredItems.length === 0 && (
        <List.EmptyView
          title="No items found"
          description="Try adjusting your search query"
          icon={Icon.MagnifyingGlass}
        />
      )}
    </List>
  );
}
