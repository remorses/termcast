# Custom Renderable List V2 - Exploration Plan

This document outlines minimal additions to `custom-renderable-list-v2.tsx` to explore
unexplored patterns needed for full List component migration.

## Current State

The v2 example already has:
- Parent `CustomListRenderable` with scrollbox, search input, filtering
- `CustomListItemWrapperRenderable` with self-registration via `onLifecyclePass`
- `CustomListSectionWrapperRenderable` for grouping
- `CustomListEmptyViewWrapperRenderable` as data holder
- Zustand store for `selectedIndex`, `visibleCount`, `searchQuery`, `renderTick`
- Keyboard navigation (up/down/enter)
- Action dialog on Ctrl+K

---

## Phase 1: Bidirectional Selection Sync

**Goal:** Support `selectedItemId` prop that syncs selection from parent.

### Changes

1. Add to zustand store:
```typescript
interface CustomListStoreState {
  // ... existing
  selectedItemId: string | null  // controlled selection by id
}
```

2. Add `itemId` prop to `CustomListItemWrapperRenderable`:
```typescript
public itemId?: string  // optional unique id for controlled selection
```

3. Add setter on `CustomListRenderable` for `selectedItemId`:
```typescript
private _selectedItemId: string | null = null
set selectedItemId(value: string | null) {
  if (this._selectedItemId === value) return
  this._selectedItemId = value
  // Find item with this id and update selectedIndex
  const item = this.getAllItems().find(i => i.itemId === value)
  if (item && item.visibleIndex !== -1) {
    useCustomListStore.setState({ selectedIndex: item.visibleIndex })
    this.scrollToIndex(item.visibleIndex)
  }
}
```

4. Add `onSelectionChange` callback prop:
```typescript
public onSelectionChange?: (id: string | null) => void

// Call in moveSelection():
const selectedItem = this.getAllItems().find(i => i.visibleIndex === newIndex)
this.onSelectionChange?.(selectedItem?.itemId ?? null)
```

5. Update React component to pass props:
```tsx
<custom-list-v2
  ref={listRef}
  selectedItemId={props.selectedItemId}
  onSelectionChange={props.onSelectionChange}
>
```

### Test Case
```tsx
function Example() {
  const [selectedId, setSelectedId] = useState<string | null>('banana')
  
  return (
    <box>
      <text>Selected: {selectedId}</text>
      <button onPress={() => setSelectedId('apple')}>Select Apple</button>
      <CustomList 
        selectedItemId={selectedId}
        onSelectionChange={setSelectedId}
      >
        <CustomList.Item itemId="apple" title="Apple" />
        <CustomList.Item itemId="banana" title="Banana" />
      </CustomList>
    </box>
  )
}
```

---

## Phase 2: Detail Panel Support

**Goal:** Show detail content in side panel when item is selected.

### Changes

1. Add to zustand store:
```typescript
interface CustomListStoreState {
  // ... existing
  isShowingDetail: boolean
  currentDetailNode: React.ReactNode | null
}
```

2. Add `detail` prop to item wrapper:
```typescript
// In CustomListItemWrapperRenderable
public detail?: React.ReactNode
```

3. Add `isShowingDetail` prop to parent:
```typescript
// In CustomListRenderable
private _isShowingDetail = false
set isShowingDetail(value: boolean) {
  this._isShowingDetail = value
  useCustomListStore.setState({ isShowingDetail: value })
  this.updateCurrentDetail()
}

private updateCurrentDetail() {
  if (!this._isShowingDetail) {
    useCustomListStore.setState({ currentDetailNode: null })
    return
  }
  const { selectedIndex } = useCustomListStore.getState()
  const item = this.getAllItems().find(i => i.visibleIndex === selectedIndex)
  useCustomListStore.setState({ currentDetailNode: item?.detail ?? null })
}
```

4. Call `updateCurrentDetail()` when selection changes:
```typescript
// In moveSelection() after updating selectedIndex
this.updateCurrentDetail()
```

5. React component renders detail panel:
```tsx
function CustomList({ children, isShowingDetail }: ListProps) {
  const currentDetailNode = useCustomListStore(s => s.currentDetailNode)
  
  return (
    <custom-list-v2 ref={listRef} isShowingDetail={isShowingDetail}>
      <box flexDirection="row" flexGrow={1}>
        {/* List content */}
        <box width={isShowingDetail ? '50%' : '100%'}>
          {children}
        </box>
        
        {/* Detail panel */}
        {isShowingDetail && currentDetailNode && (
          <box width="50%" borderLeft>
            {currentDetailNode}
          </box>
        )}
      </box>
    </custom-list-v2>
  )
}
```

### Test Case
```tsx
<CustomList isShowingDetail>
  <CustomList.Item 
    title="Apple" 
    detail={<box><text>Apple details here</text></box>}
  />
</CustomList>
```

---

## Phase 3: Controlled Search Text

**Goal:** Support both controlled (`searchText` prop) and uncontrolled search.

### Changes

1. Add to zustand store:
```typescript
interface CustomListStoreState {
  // ... existing  
  isControlledSearch: boolean
}
```

2. Add controlled search props to renderable:
```typescript
// In CustomListRenderable
public onSearchTextChange?: (text: string) => void

private _searchText: string | undefined = undefined
set searchText(value: string | undefined) {
  if (value === undefined) return  // uncontrolled mode
  if (this._searchText === value) return
  this._searchText = value
  
  // Sync to textarea
  this.searchInput.editBuffer?.setText(value)
  this.searchQuery = value
  this.refilter()
}
```

3. Modify `onContentChange` handler to call callback:
```typescript
this.searchInput.onContentChange = () => {
  const value = this.searchInput.editBuffer?.getText() || ''
  
  // Always call callback if provided
  this.onSearchTextChange?.(value)
  
  // Only update internal state if uncontrolled
  if (this._searchText === undefined) {
    this.setSearchQuery(value)
  }
}
```

4. React component passes props:
```tsx
function CustomList({ searchText, onSearchTextChange, ...props }) {
  return (
    <custom-list-v2
      ref={listRef}
      searchText={searchText}
      onSearchTextChange={onSearchTextChange}
    >
      {children}
    </custom-list-v2>
  )
}
```

### Test Case
```tsx
function Example() {
  const [search, setSearch] = useState('')
  
  return (
    <box>
      <text>Search: {search}</text>
      <CustomList 
        searchText={search}
        onSearchTextChange={setSearch}
      >
        {/* items */}
      </CustomList>
    </box>
  )
}
```

---

## Phase 4: Item Actions + Offscreen Pattern

**Goal:** Each item can have actions, first action title shown in footer.

### Changes

1. Add to zustand store:
```typescript
interface CustomListStoreState {
  // ... existing
  firstActionTitle: string
  currentItemActions: React.ReactNode | null
}
```

2. Add `actions` prop to item wrapper:
```typescript
// In CustomListItemWrapperRenderable
public actions?: React.ReactNode
```

3. Update store when selection changes:
```typescript
// In CustomListRenderable.moveSelection()
private updateCurrentActions() {
  const { selectedIndex } = useCustomListStore.getState()
  const item = this.getAllItems().find(i => i.visibleIndex === selectedIndex)
  useCustomListStore.setState({ 
    currentItemActions: item?.actions ?? null 
  })
}
```

4. Render actions offscreen to collect first title:
```tsx
function CustomList({ children }) {
  const currentItemActions = useCustomListStore(s => s.currentItemActions)
  
  return (
    <custom-list-v2 ref={listRef}>
      {children}
      
      {/* Offscreen rendering to collect first action title */}
      {currentItemActions && (
        <Offscreen>
          <ActionTitleCollector>{currentItemActions}</ActionTitleCollector>
        </Offscreen>
      )}
      
      <Footer firstActionTitle={useCustomListStore.getState().firstActionTitle} />
    </custom-list-v2>
  )
}

// Separate component that extracts first action title
function ActionTitleCollector({ children }) {
  // Uses action descendants to find first action
  // Sets useCustomListStore.setState({ firstActionTitle: ... })
  return children
}
```

### Test Case
```tsx
<CustomList.Item
  title="Apple"
  actions={
    <ActionPanel>
      <Action title="Eat Apple" onAction={() => {}} />
      <Action title="Peel Apple" onAction={() => {}} />
    </ActionPanel>
  }
/>
// Footer should show "Eat Apple" as first action
```

---

## Phase 5: Section Visibility During Search

**Goal:** Hide section headers when searching, hide section if no visible items.

### Changes

1. Track visible items per section in refilter:
```typescript
// In CustomListRenderable.refilter()
private refilter() {
  const query = this.searchQuery.toLowerCase()
  const allItems = this.getAllItems()
  let visibleIndex = 0
  
  // Track visible items per section
  const sectionVisibility = new Map<CustomListSectionWrapperRenderable, boolean>()
  
  for (const item of allItems) {
    const matches = !query || this.scoreItem(item, query) > 0
    item.visible = matches
    item.visibleIndex = matches ? visibleIndex++ : -1
    
    // Track section visibility
    if (item.section) {
      if (matches) {
        sectionVisibility.set(item.section, true)
      } else if (!sectionVisibility.has(item.section)) {
        sectionVisibility.set(item.section, false)
      }
    }
  }
  
  // Update section visibility
  for (const section of this.registeredSections) {
    const hasVisibleItems = sectionVisibility.get(section) ?? false
    section.visible = hasVisibleItems
    // Also hide title when searching
    section.hideTitle = query.length > 0
  }
  
  // ... rest of refilter
}
```

2. Add `hideTitle` to section wrapper:
```typescript
// In CustomListSectionWrapperRenderable
public hideTitle = false
```

3. React section component reads `hideTitle`:
```tsx
function CustomListSection({ title, children }) {
  const wrapperRef = useRef<CustomListSectionWrapperRenderable>(null)
  // Force re-render on filter changes
  useCustomListStore(s => s.renderTick)
  
  const showTitle = title && !wrapperRef.current?.hideTitle
  
  return (
    <custom-list-section-wrapper-v2 ref={wrapperRef} sectionTitle={title}>
      {showTitle && <text>── {title} ──</text>}
      {children}
    </custom-list-section-wrapper-v2>
  )
}
```

---

## Phase 6: Mouse Hover States

**Goal:** Items highlight on hover, clicking selects.

### Changes

1. Add hover tracking in item wrapper:
```typescript
// In CustomListItemWrapperRenderable constructor
this.onMouseMove = () => {
  // Update selection to this item
  if (this.visibleIndex !== -1) {
    const { selectedIndex } = useCustomListStore.getState()
    if (selectedIndex !== this.visibleIndex) {
      useCustomListStore.setState({ selectedIndex: this.visibleIndex })
      this.parentList?.onSelectionChange?.(this.itemId ?? null)
    }
  }
}

this.onMouseDown = () => {
  // Execute action on click
  this.onAction?.()
}
```

2. Item already re-renders on selection change via zustand, so background color updates automatically.

**Note:** This approach means hover = select. Alternative is separate hover state in zustand, but that's more complex.

---

## Implementation Order

1. **Phase 1: Bidirectional Selection** - Foundation for controlled components
2. **Phase 2: Detail Panel** - Tests ReactNode passing through renderables
3. **Phase 4: Actions** - Tests offscreen pattern (needed before phase 3)
4. **Phase 3: Controlled Search** - Builds on patterns from phase 1
5. **Phase 5: Section Visibility** - Independent, can do anytime
6. **Phase 6: Mouse Hover** - Simple addition, can do anytime

---

## Files to Create

1. `custom-renderable-list-v2-phase1.tsx` - Add bidirectional selection
2. `custom-renderable-list-v2-phase2.tsx` - Add detail panel (builds on phase1)
3. Continue incrementally...

Or: Add all phases to a single `custom-renderable-list-v2-full.tsx` with feature flags.

---

## Success Criteria

Each phase should have:
1. Working example code
2. Test case demonstrating the feature
3. Vitest snapshot test (`.vitest.tsx`)
4. No regressions to existing functionality
