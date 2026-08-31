/**
 * Example: raster images in List side-detail markdown, Grid cells, and full Detail.
 * Uses Unsplash landscape photos so screenshots show real pixels.
 */

import { List, Grid, Detail, Action, ActionPanel } from 'termcast'
import { useNavigation } from 'termcast/src/internal/navigation'
import { renderWithProviders } from '../utils'
import dedent from 'string-dedent'

const photos = [
  {
    id: 'alps',
    title: 'Alpine Lake',
    subtitle: 'Switzerland',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=640&h=480&fit=crop',
  },
  {
    id: 'forest',
    title: 'Forest Path',
    subtitle: 'Oregon',
    url: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&h=480&fit=crop',
  },
  {
    id: 'night',
    title: 'Night Ridge',
    subtitle: 'Dolomites',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=640&h=480&fit=crop',
  },
  {
    id: 'meadow',
    title: 'Green Meadow',
    subtitle: 'Scotland',
    url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=640&h=480&fit=crop',
  },
]

function photoMarkdown({
  title,
  subtitle,
  url,
}: {
  title: string
  subtitle: string
  url: string
}): string {
  return dedent`
    # ${title}

    ![${title}](${url})

    ${subtitle}
  `
}

function PhotoDetail({
  title,
  subtitle,
  url,
}: {
  title: string
  subtitle: string
  url: string
}): any {
  return (
    <Detail
      navigationTitle={title}
      markdown={photoMarkdown({ title, subtitle, url })}
    />
  )
}

function PhotoGrid(): any {
  const { push } = useNavigation()

  return (
    <Grid
      navigationTitle='Photo Grid'
      searchBarPlaceholder='Search photos...'
      columns={2}
      aspectRatio='4/3'
      fit='contain'
    >
      {photos.map((photo) => (
        <Grid.Item
          key={photo.id}
          id={photo.id}
          title={photo.title}
          subtitle={photo.subtitle}
          content={photo.url}
          actions={
            <ActionPanel>
              <Action
                title='Open Detail'
                onAction={() => {
                  push(
                    <PhotoDetail
                      title={photo.title}
                      subtitle={photo.subtitle}
                      url={photo.url}
                    />,
                  )
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </Grid>
  )
}

function ImageShowcase(): any {
  const { push } = useNavigation()

  return (
    <List
      navigationTitle='Image Showcase'
      searchBarPlaceholder='Search photos...'
      isShowingDetail
    >
      {photos.map((photo) => (
        <List.Item
          key={photo.id}
          id={photo.id}
          title={photo.title}
          subtitle={photo.subtitle}
          detail={
            <List.Item.Detail
              markdown={photoMarkdown({
                title: photo.title,
                subtitle: photo.subtitle,
                url: photo.url,
              })}
            />
          }
          actions={
            <ActionPanel>
              <Action
                title='Open Grid'
                onAction={() => {
                  push(<PhotoGrid />)
                }}
              />
              <Action
                title='Open Detail'
                onAction={() => {
                  push(
                    <PhotoDetail
                      title={photo.title}
                      subtitle={photo.subtitle}
                      url={photo.url}
                    />,
                  )
                }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  )
}

await renderWithProviders(<ImageShowcase />)
