import React, { useState } from 'react'
import { Action, ActionPanel, List } from 'termcast'
import { renderWithProviders } from '../utils'

interface Pokemon {
  name: string
  height: number
  weight: number
  id: string
  types: string[]
  abilities: Array<{ name: string; isMainSeries: boolean }>
}

const pokemons: Pokemon[] = [
  {
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    id: '001',
    types: ['Grass', 'Poison'],
    abilities: [
      { name: 'Chlorophyll', isMainSeries: true },
      { name: 'Overgrow', isMainSeries: true },
    ],
  },
  {
    name: 'ivysaur',
    height: 10,
    weight: 130,
    id: '002',
    types: ['Grass', 'Poison'],
    abilities: [
      { name: 'Chlorophyll', isMainSeries: true },
      { name: 'Overgrow', isMainSeries: true },
    ],
  },
  {
    name: 'charmander',
    height: 6,
    weight: 85,
    id: '004',
    types: ['Fire'],
    abilities: [
      { name: 'Blaze', isMainSeries: true },
      { name: 'Solar Power', isMainSeries: true },
    ],
  },
  {
    name: 'charmeleon',
    height: 11,
    weight: 190,
    id: '005',
    types: ['Fire'],
    abilities: [
      { name: 'Blaze', isMainSeries: true },
      { name: 'Solar Power', isMainSeries: true },
    ],
  },
  {
    name: 'squirtle',
    height: 5,
    weight: 90,
    id: '007',
    types: ['Water'],
    abilities: [
      { name: 'Torrent', isMainSeries: true },
      { name: 'Rain Dish', isMainSeries: true },
    ],
  },
  {
    name: 'wartortle',
    height: 10,
    weight: 225,
    id: '008',
    types: ['Water'],
    abilities: [
      { name: 'Torrent', isMainSeries: true },
      { name: 'Rain Dish', isMainSeries: true },
    ],
  },
]

const ListWithDetailExample = () => {
  const [showingDetail, setShowingDetail] = useState(true)

  return (
    <List
      navigationTitle='Pokemon List'
      searchBarPlaceholder='Search Pokemon...'
      isShowingDetail={showingDetail}
    >
      {pokemons.map((pokemon) => {
        const detailComponent = showingDetail ? (
          <List.Item.Detail
            markdown={`# ${pokemon.name}\n\n![Illustration](https://assets.pokemon.com/assets/cms2/img/pokedex/full/${
              pokemon.id
            }.png)\n\n## Types\n${pokemon.types.join(' / ')}\n\n## Characteristics\n- Height: ${
              pokemon.height / 10
            }m\n- Weight: ${pokemon.weight / 10}kg\n\n## Abilities\n${pokemon.abilities
              .map((a) => `- ${a.name}`)
              .join('\n')}`}
            metadata={
              (<List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label title='Types' />
                {pokemon.types.flatMap((type, index) => [
                  index > 0 ? <List.Item.Detail.Metadata.Separator /> : null,
                  <List.Item.Detail.Metadata.Label title={type} />
                ].filter(Boolean))}
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title='Characteristics' />
                <List.Item.Detail.Metadata.Label title='Height' text={`${pokemon.height / 10}m`} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title='Weight' text={`${pokemon.weight / 10}kg`} />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title='Abilities' />
                {pokemon.abilities.flatMap((ability, index) => [
                  index > 0 ? <List.Item.Detail.Metadata.Separator /> : null,
                  <List.Item.Detail.Metadata.Label
                    title={ability.name}
                    text={ability.isMainSeries ? 'Main Series' : 'Hidden'}
                  />
                ].filter(Boolean))}
              </List.Item.Detail.Metadata>) as any
            }
          />
        ) : null

        const props: any = showingDetail
          ? { detail: detailComponent }
          : { accessories: [{ text: pokemon.types.join(' / ') }] }
        return (
          <List.Item
            key={pokemon.id}
            id={pokemon.id}
            title={pokemon.name}
            subtitle={`#${pokemon.id}`}
            {...props}
            actions={
              <ActionPanel>
                <ActionPanel.Section>
                  <Action
                    title='Toggle Detail'
                    onAction={() => setShowingDetail(!showingDetail)}
                  />
                  <Action
                    title='View on Pokemon.com'
                    onAction={() => {
                      console.log(`Opening https://www.pokemon.com/us/pokedex/${pokemon.name}`)
                    }}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        )
      })}
    </List>
  )
}

renderWithProviders(<ListWithDetailExample />)
