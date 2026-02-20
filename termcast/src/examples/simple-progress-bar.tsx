// Example: ProgressBar rendered inside List.Item.Detail.Metadata.
// Shows usage-style rows with title, bar+percentage in one line, and reset labels.

import React from 'react'
import { List, ProgressBar } from 'termcast'
import { renderWithProviders } from '../utils'

interface UsageItem {
  title: string
  subtitle: string
  sessionUsage: number
  sessionReset: string
  weekUsage: number
  weekReset: string
}

const usageItems: UsageItem[] = [
  {
    title: 'OpenAI account',
    subtitle: 'default workspace',
    sessionUsage: 37,
    sessionReset: 'Resets 9pm (Asia/Bangkok)',
    weekUsage: 7,
    weekReset: 'Resets Feb 27, 1pm (Asia/Bangkok)',
  },
  {
    title: 'Anthropic account',
    subtitle: 'research workspace',
    sessionUsage: 82,
    sessionReset: 'Resets 11pm (Europe/Rome)',
    weekUsage: 46,
    weekReset: 'Resets Mar 1, 9am (Europe/Rome)',
  },
  {
    title: 'Google account',
    subtitle: 'sandbox workspace',
    sessionUsage: 15,
    sessionReset: 'Resets 6pm (America/New_York)',
    weekUsage: 24,
    weekReset: 'Resets Mar 3, 8am (America/New_York)',
  },
]

function SimpleProgressBar() {
  return (
    <List navigationTitle="ProgressBar Metadata" isShowingDetail={true}>
      {usageItems.map((item) => {
        return (
          <List.Item
            key={item.title}
            title={item.title}
            subtitle={item.subtitle}
            detail={
              <List.Item.Detail
                metadata={
                  <List.Item.Detail.Metadata>
                    <ProgressBar
                      title="Current session"
                      value={item.sessionUsage}
                      percentageSuffix="used"
                      label={item.sessionReset}
                    />
                    <ProgressBar
                      title="Current week (all models)"
                      value={item.weekUsage}
                      percentageSuffix="used"
                      label={item.weekReset}
                    />
                  </List.Item.Detail.Metadata>
                }
              />
            }
          />
        )
      })}
    </List>
  )
}

renderWithProviders(<SimpleProgressBar />)
