// curl -H 'accept: application/json' \
//      -H 'content-type: application/json' \
//      -H 'cookie: __raycast_session=REDACTED' \
//      -H 'user-agent: Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))' \
//      -H 'authorization: Bearer REDACTED' \
//      -H 'accept-language: en-GB,en;q=0.9' \
//      https://backend.raycast.com/api/v1/extensions/mt40/memo

export async function fetchExtension({
  author,
  extension,
}: {
  author: string
  extension: string
}): Promise<ExtensionResponse> {
  const response = await fetch(
    `https://backend.raycast.com/api/v1/extensions/${author}/${extension}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'user-agent': 'Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))',
        'accept-language': 'en-GB,en;q=0.9',
      },
    },
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch extension: ${response.status} ${response.statusText}`,
    )
  }

  return response.json() as any
}

interface Author {
  id: string
  name: string
  handle: string
  bio: string | null
  twitter_handle: string | null
  github_handle: string | null
  location: string | null
  initials: string
  avatar_placeholder_color: string
  slack_community_username: string | null
  slack_community_user_id: string | null
  created_at: number
  website_anchor: string | null
  website: string | null
  credits: number
  username: string
  avatar: string | null
}

interface Icons {
  light: string | null
  dark: string | null
}

interface Command {
  id: string
  name: string
  title: string
  subtitle: string
  description: string
  keywords: string[]
  mode: string
  disabled_by_default: boolean
  beta: boolean
  icons: Icons
}

interface ChangelogVersion {
  title: string
  title_link: string | null
  date: string
  markdown: string
}

interface Changelog {
  versions: ChangelogVersion[]
}

interface ExtensionResponse {
  id: string
  name: string
  native_id: string | null
  seo_categories: string[]
  platforms: string[] | null
  author: Author
  created_at: number
  kill_listed_at: number
  owner: Author
  status: string
  is_new: boolean
  access: string
  store_url: string
  download_count: number
  past_contributors: any[]
  listed: boolean
  title: string
  description: string
  commit_sha: string
  relative_path: string
  api_version: string
  categories: string[]
  prompt_examples: any[]
  metadata_count: number
  updated_at: number
  source_url: string
  readme_url: string
  readme_assets_path: string
  icons: Icons
  commands: Command[]
  tools: any[]
  download_url: string
  contributors: any[]
  metadata: string[]
  changelog: Changelog
}
