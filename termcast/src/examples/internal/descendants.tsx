import React from 'react'
import { createDescendants } from '@termcast/api/src/descendants'
import { renderWithProviders } from '../../utils'
import { logger } from '../../logger'
const { Descendants, useDescendants, useDescendant } = createDescendants<{
    title?: string
}>()

const Menu = () => {
    const context = useDescendants()

    const items = Object.values(context.map.current)

    logger.log(items)
    return (
        <Descendants value={context}>
            <box>
                <Item title='First Item' />
                <Item title='Second Item' />
                {items.map((x) => {
                    return <text>{x.props?.title}</text>
                })}
            </box>
        </Descendants>
    )
}

const Item = ({ title }: { title: string }) => {
    const index = useDescendant({ title })

    return null
}

renderWithProviders(<Menu />)
