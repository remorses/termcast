import { List, ActionPanel, Action, Icon } from "@raycast/api";

export default function ListItems() {
  const items = [
    { id: "1", title: "First Item", subtitle: "This is the first item" },
    { id: "2", title: "Second Item", subtitle: "This is the second item" },
    { id: "3", title: "Third Item", subtitle: "This is the third item" },
    { id: "4", title: "Fourth Item", subtitle: "This is the fourth item" },
    { id: "5", title: "Fifth Item", subtitle: "This is the fifth item" },
  ];

  return (
    <List navigationTitle="List Items">
      <List.Section title="Items">
        {items.map((item) => (
          <List.Item
            key={item.id}
            id={item.id}
            title={item.title}
            subtitle={item.subtitle}
            icon={Icon.Circle}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard
                  title="Copy Item Title"
                  content={item.title}
                />
                <Action.OpenInBrowser
                  title="Open Example"
                  url="https://example.com"
                />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}