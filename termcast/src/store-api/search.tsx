// curl -H 'accept: application/json' \
//      -H 'content-type: application/json' \
//      -H 'user-agent: Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))' \
//      -H 'authorization: Bearer REDACTED' \
//      -H 'accept-language: en-GB,en;q=0.9' \
//      'https://backend.raycast.com/api/v1/store_listings/search?per_page=25&q=notion&include_native=true&page=1&platform=macOS'

export async function searchStoreListings({
    query,
    page = 1,
    perPage = 25,
    includeNative = true,
    platform = 'macOS',
}: {
    query: string
    page?: number
    perPage?: number
    includeNative?: boolean
    platform?: string
}): Promise<StoreSearchResponse> {
    const params = new URLSearchParams({
        q: query,
        page: page.toString(),
        per_page: perPage.toString(),
        include_native: includeNative.toString(),
        platform: platform,
    })

    const response = await fetch(
        `https://backend.raycast.com/api/v1/store_listings/search?${params}`,
        {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                'user-agent':
                    'Raycast/1.102.6 (macOS Version 15.6 (Build 24G84))',
                'accept-language': 'en-GB,en;q=0.9',
            },
        },
    )

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
    }

    return (await response.json()) as StoreSearchResponse
}

interface StoreSearchResponse {
    data: StoreListing[]
}

interface StoreListing {
    id: string
    name: string
    native_id: string | null
    seo_categories: string[]
    platforms: string[] | null
    created_at: number
    author: User
    owner:
        | User
        | {
              id: string
              name: string
              handle: string
              initials: string
              avatar_placeholder_color: string
              avatar: string
          }
    status: string
    is_new: boolean
    access: string
    store_url: string
    download_count: number
    kill_listed_at: number | null
    title: string
    description: string
    commit_sha: string
    relative_path: string
    api_version: string
    categories: string[]
    prompt_examples: string[]
    metadata_count: number
    updated_at: number
    source_url: string
    readme_url: string
    readme_assets_path: string
    icons: {
        light: string | null
        dark: string | null
    }
    download_url: string
    commands: Command[]
    contributors: User[]
    tools: Tool[]
}

interface User {
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
    website_anchor: string | null
    created_at: number
    website: string | null
    username: string
    avatar: string | null
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
    icons: {
        light: string | null
        dark: string | null
    }
}

interface Tool {
    id: string
    name: string
    title: string
    description: string
    keywords: string[]
    functionalities: unknown[]
    mode: string | null
    side_effects: boolean
    icons: {
        light: string | null
        dark: string | null
    }
}
