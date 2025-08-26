import { ReactNode, ReactElement, Children, isValidElement } from 'react'
import { SelectOption, fg, t } from '@opentui/core'
import { logger } from './logger'

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
          text?:
              | string
              | null
              | {
                    value: string | null
                    color?: Color
                }
      }
    | {
          date?:
              | Date
              | null
              | {
                    value: Date | null
                    color?: Color
                }
      }
    | {
          tag?:
              | string
              | {
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
    title:
        | string
        | {
              value: string
              tooltip?: string | null
          }
    subtitle?:
        | string
        | {
              value?: string | null
              tooltip?: string | null
          }
    keywords?: string[]
    icon?:
        | Image.ImageLike
        | {
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

export interface ListProps
    extends ActionsInterface,
        NavigationChildInterface,
        SearchBarInterface,
        PaginationInterface {
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

// Helper function to convert ItemProps to SelectOption
function convertItemToOption(itemProps: ItemProps): SelectOption {
    const { title, subtitle, accessories, id } = itemProps

    // Get title text (handle both string and object forms)
    const titleText = typeof title === 'string' ? title : title.value

    // Build description from subtitle and accessories
    let descriptionParts: ReactNode[] = []

    // Add subtitle if present
    if (subtitle) {
        const subtitleText =
            typeof subtitle === 'string' ? subtitle : subtitle.value || ''
        if (subtitleText) {
            descriptionParts.push(subtitleText)
        }
    }

    // Add accessories with different colors
    if (accessories) {
        const accessoryTexts = accessories.map(formatAccessory).filter(Boolean)
        descriptionParts = descriptionParts.concat(accessoryTexts)
    }

    return {
        name: titleText,
        description: descriptionParts.join(' • '), // Use bullet separator
        value: id || titleText, // Use id if provided, otherwise fallback to title
    }
}

// Helper function to format accessories with colors using OpenTUI t template and fg
function formatAccessory(accessory: ItemAccessory): ReactNode {
    if ('text' in accessory && accessory.text) {
        const textValue =
            typeof accessory.text === 'string'
                ? accessory.text
                : accessory.text?.value
        if (textValue) {
            return t`${fg('#0080FF')(textValue)}` // Blue for text accessories
        }
    }

    if ('date' in accessory && accessory.date) {
        const dateValue =
            typeof accessory.date === 'object' && 'value' in accessory.date
                ? accessory.date.value
                : (accessory.date as Date)
        if (dateValue) {
            const formattedDate = formatRelativeDate(dateValue)
            return t`${fg('#00FF80')(formattedDate)}` // Green for date accessories
        }
    }

    if ('tag' in accessory && accessory.tag) {
        const tagValue =
            typeof accessory.tag === 'string'
                ? accessory.tag
                : accessory.tag?.value
        if (tagValue) {
            return t`${fg('#FF8000')(tagValue)}` // Orange for tag accessories
        }
    }

    if ('icon' in accessory && (accessory.text || accessory.tooltip)) {
        const text = accessory.text || accessory.tooltip || 'icon'
        return t`${fg('#FFFF00')(text)}` // Yellow for icon accessories
    }

    return ''
}

// Simple relative date formatter
function formatRelativeDate(date: Date): string {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'today'
    if (diffDays === 1) return '1d ago'
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}m ago`
    return `${Math.floor(diffDays / 365)}y ago`
}

const List: ListType = (props) => {
    const { children, onSelectionChange, ...otherProps } = props

    // Convert children to SelectOptions
    const options: SelectOption[] = []

    Children.forEach(children, (child) => {
        if (isValidElement(child) && child.type === ListItem) {
            const itemProps = child.props as ItemProps
            const option = convertItemToOption(itemProps)
            options.push(option)
        }
    })

    const handleChange = (index: number, option: SelectOption | null) => {
        if (onSelectionChange && option) {
            onSelectionChange(option.value)
        }
    }

    // TODO: Handle other props like searchText, filtering, isLoading, etc.
    // TODO: Handle navigationTitle, actions, searchBarAccessory
    // TODO: Handle pagination

    // logger.log({ options })
    return (
        <select
            options={options}
            focused={true} // TODO: Make this configurable
            onChange={handleChange}
            showDescription={true}
            showScrollIndicator={true}
            style={{ flexGrow: 1 }}
        />
    )
}

const ListItem: ListItemType = (props) => {
    // List.Item components are processed by their parent List component
    // They don't render anything directly in the TUI context
    // TODO: Support detail view rendering
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
