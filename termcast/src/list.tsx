import { ReactNode, ReactElement } from 'react'

interface ActionsInterface {
  actions?: ReactNode
}

interface NavigationChildInterface {
  navigationTitle?: string
  isLoading?: boolean
}

interface SearchBarInterface {
  filtering?: boolean | { keepSectionOrder: boolean }
  isLoading?: boolean
  onSearchTextChange?: (newValue: string) => void
  searchBarPlaceholder?: string
  throttle?: boolean
}

interface PaginationInterface {
  pagination?: {
    pageSize: number
    hasMore: boolean
    onLoadMore: () => void
  }
}

export type Color = string

export namespace Image {
  export type ImageLike = string
}

export type ItemAccessory =
  | {
      text?: string | null | {
        value: string | null
        color?: Color
      }
    }
  | {
      date?: Date | null | {
        value: Date | null
        color?: Color
      }
    }
  | {
      tag?: string | {
        value: string
        color?: Color
      }
    }
  | {
      icon?: Image.ImageLike | null
      text?: string | null
      tooltip?: string | null
    }

export interface ItemProps extends ActionsInterface {
  id?: string
  title: string | {
    value: string
    tooltip?: string | null
  }
  subtitle?: string | {
    value?: string | null
    tooltip?: string | null
  }
  keywords?: string[]
  icon?: Image.ImageLike | {
    value: Image.ImageLike | null
    tooltip: string
  }
  accessories?: ItemAccessory[]
  detail?: ReactElement<DetailProps>
}

export interface DetailProps {
  isLoading?: boolean
  markdown?: string
  metadata?: ReactElement<MetadataProps>
}

export interface MetadataProps {
  children?: ReactNode
}

export interface DropdownItemProps {
  value: string
  title: string
  icon?: Image.ImageLike | null
  keywords?: string[]
}

export interface DropdownSectionProps {
  children?: ReactNode
  title?: string
}

export interface DropdownProps extends SearchBarInterface {
  id?: string
  tooltip: string
  placeholder?: string
  storeValue?: boolean
  value?: string
  defaultValue?: string
  onChange?: (newValue: string) => void
  children?: ReactNode
}

export interface SectionProps {
  children?: ReactNode
  id?: string
  title?: string
  subtitle?: string
}

export interface ListProps extends ActionsInterface, NavigationChildInterface, SearchBarInterface, PaginationInterface {
  actions?: ReactNode
  children?: ReactNode
  onSelectionChange?: (id: string | null) => void
  searchBarAccessory?: ReactElement<DropdownProps> | null
  searchText?: string
  enableFiltering?: boolean
  searchBarPlaceholder?: string
  selectedItemId?: string
  isShowingDetail?: boolean
}

interface ListType {
  (props: ListProps): any
  Item: ListItemType
  Section: (props: SectionProps) => any
  Dropdown: ListDropdownType
  EmptyView: (props: EmptyViewProps) => any
}

interface ListItemType {
  (props: ItemProps): any
  Detail: ListItemDetailType
}

interface ListItemDetailType {
  (props: DetailProps): any
  Metadata: (props: MetadataProps) => any
}

interface ListDropdownType {
  (props: DropdownProps): any
  Item: (props: DropdownItemProps) => any
  Section: (props: DropdownSectionProps) => any
}

interface EmptyViewProps extends ActionsInterface {
  icon?: Image.ImageLike
  title?: string
  description?: string
}

const List: ListType = (props) => {
  return null
}

const ListItem: ListItemType = (props) => {
  return null
}

const ListItemDetail: ListItemDetailType = (props) => {
  return null
}

ListItemDetail.Metadata = (props) => {
  return null
}

ListItem.Detail = ListItemDetail

const ListDropdown: ListDropdownType = (props) => {
  return null
}

ListDropdown.Item = (props) => {
  return null
}

ListDropdown.Section = (props) => {
  return null
}

List.Item = ListItem
List.Section = (props) => {
  return null
}
List.Dropdown = ListDropdown
List.EmptyView = (props) => {
  return null
}


export default List
