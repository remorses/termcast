/**
 * E2E tests for Detail.Metadata showcase demonstrating all metadata variations:
 * - Row vs column layouts based on text length
 * - Colored text values
 * - Header labels (title only)
 * - Separators between groups
 * - Links with underlines
 * - TagLists with colored tags
 */

import { test, expect, afterEach, beforeEach } from 'vitest'
import { launchTerminal, Session } from 'tuistory/src'

let session: Session

beforeEach(async () => {
  session = await launchTerminal({
    command: 'bun',
    args: ['src/examples/detail-metadata-showcase.tsx'],
    cols: 100,
    rows: 120,
  })
})

afterEach(() => {
  session?.close()
})

test('detail metadata showcase renders markdown and metadata together', async () => {
  const snapshot = await session.text({
    waitFor: (text) => {
      return (
        text.includes('Project Update') &&
        text.includes('Basic Information') &&
        text.includes('Alice Johnson') &&
        text.includes('Watchers') &&
        text.includes('powered by termcast')
      )
    },
    timeout: 20000,
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "




      Project Update: Q1 2024 Review

      This detail view demonstrates markdown content alongside metadata.

      ---

      Summary

      The project has made significant progress this quarter. Key highlights include:

      - Completed the new authentication system
      - Migrated 85% of users to the new platform
      - Reduced API response time by 40%

      Technical Details

      The refactoring effort focused on three main areas:

      1. Database optimization - Indexed frequently queried columns
      2. Caching layer - Added Redis for session management
      3. Code cleanup - Removed deprecated endpoints

      Next Steps

      We will continue with Phase 2 in the upcoming sprint. The team should prioritize:

      - Finishing the remaining user migrations
      - Implementing the new dashboard
      - Writing integration tests

      ---

      Last updated: January 20, 2024

      Basic Information

      Name:        Alice Johnson

      Role:        Engineer

      Team:        Platform

      ────────────────────────────────────────────────────────────────────────────────────────────

      Status:      Active

      Priority:    High

      Type:        Feature

      Risk:        Medium

      ────────────────────────────────────────────────────────────────────────────────────────────

      Description: This is a comprehensive metadata showcase that demonstrates all the different
                   ways you can display information using the Detail.Metadata component.

      File Path:   /Users/developer/projects/termcast/src/examples/detail-metadata-showcase.tsx

      Author:      Alice Johnson

      Reviewer:    Bob Smith

      ────────────────────────────────────────────────────────────────────────────────────────────

      Repository:  github.com/example

      Docs:        docs.example.com

      PR Link:     github.com/organization/repository/pull/12345

      ────────────────────────────────────────────────────────────────────────────────────────────

      Labels:      documentation enhancement good first issue

      Tags:        bug feature urgent design backend

      Timestamps

      Created:     2024-01-15 09:30:00

      Updated:     2024-01-20 14:45:00

      Due Date:    2024-02-01

      ────────────────────────────────────────────────────────────────────────────────────────────

      Metrics

      Comments:    42

      Reactions:   +127

      Views:       1,234

      Watchers:    @alice @bob @charlie

















      esc go back                                                                  powered by termcast

    "
  `)

  // Markdown content
  expect(snapshot).toContain('Project Update')
  expect(snapshot).toContain('Summary')
  expect(snapshot).toContain('Technical Details')
  expect(snapshot).toContain('Next Steps')
  expect(snapshot).toContain('authentication system')
  expect(snapshot).toContain('Database optimization')

  // Header labels
  expect(snapshot).toContain('Basic Information')
  expect(snapshot).toContain('Timestamps')
  expect(snapshot).toContain('Metrics')

  // Short value labels (row layout)
  expect(snapshot).toContain('Name:')
  expect(snapshot).toContain('Alice Johnson')
  expect(snapshot).toContain('Role:')
  expect(snapshot).toContain('Engineer')

  // Separators
  expect(snapshot).toContain('─')

  // Links
  expect(snapshot).toContain('Repository:')
  expect(snapshot).toContain('github.com/example')

  // TagLists
  expect(snapshot).toContain('Labels:')
  expect(snapshot).toContain('documentation')
  expect(snapshot).toContain('Tags:')
  expect(snapshot).toContain('bug')

  // Watchers tag list
  expect(snapshot).toContain('Watchers:')
  expect(snapshot).toContain('@alice')
}, 30000)

test('detail metadata renders long values in column layout', async () => {
  const snapshot = await session.text({
    waitFor: (text) =>
      text.includes('Description:') &&
      text.includes('comprehensive') &&
      text.includes('PR Link:') &&
      text.includes('powered by termcast'),
    timeout: 15000,
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "




      Project Update: Q1 2024 Review

      This detail view demonstrates markdown content alongside metadata.

      ---

      Summary

      The project has made significant progress this quarter. Key highlights include:

      - Completed the new authentication system
      - Migrated 85% of users to the new platform
      - Reduced API response time by 40%

      Technical Details

      The refactoring effort focused on three main areas:

      1. Database optimization - Indexed frequently queried columns
      2. Caching layer - Added Redis for session management
      3. Code cleanup - Removed deprecated endpoints

      Next Steps

      We will continue with Phase 2 in the upcoming sprint. The team should prioritize:

      - Finishing the remaining user migrations
      - Implementing the new dashboard
      - Writing integration tests

      ---

      Last updated: January 20, 2024

      Basic Information

      Name:        Alice Johnson

      Role:        Engineer

      Team:        Platform

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Status:      Active

      Priority:    High

      Type:        Feature

      Risk:        Medium

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Description: This is a comprehensive metadata showcase that demonstrates all the different
                   ways you can display information using the Detail.Metadata component.

      File Path:   /Users/developer/projects/termcast/src/examples/detail-metadata-showcase.tsx

      Author:      Alice Johnson

      Reviewer:    Bob Smith

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Repository:  github.com/example

      Docs:        docs.example.com

      PR Link:     github.com/organization/repository/pull/12345

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Labels:      documentation enhancement good first issue

      Tags:        bug feature urgent design backend

      Timestamps

      Created:     2024-01-15 09:30:00

      Updated:     2024-01-20 14:45:00

      Due Date:    2024-02-01

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Metrics

      Comments:    42

      Reactions:   +127

      Views:       1,234

      Watchers:    @alice @bob @charlie



      esc go back                                                                  powered by termcast















    "
  `)

  // Long description should wrap to column layout
  expect(snapshot).toContain('Description:')
  expect(snapshot).toContain('comprehensive metadata showcase')

  // Long file path
  expect(snapshot).toContain('File Path:')
  expect(snapshot).toContain('/Users/developer/projects')

  // Long PR link
  expect(snapshot).toContain('PR Link:')
  expect(snapshot).toContain('github.com/organization/repository')
}, 30000)

test('detail metadata renders links', async () => {
  // The showcase is long; scroll so the link section is visible.
  await session.scrollDown(40)

  const snapshot = await session.text({
    waitFor: (text) =>
      text.includes('Repository:') &&
      text.includes('github.com/example') &&
      text.includes('Docs:') &&
      text.includes('docs.example.com') &&
      text.includes('PR Link:') &&
      text.includes('github.com/organization/repository/pull/12345'),
    timeout: 15000,
  })

  // Links are rendered with their text values
  expect(snapshot).toContain('Repository:')
  expect(snapshot).toContain('github.com/example')
  expect(snapshot).toContain('Docs:')
  expect(snapshot).toContain('docs.example.com')
  expect(snapshot).toContain('PR Link:')
  expect(snapshot).toContain('github.com/organization/repository/pull/12345')
}, 30000)

test('detail metadata renders separators between groups', async () => {
  const snapshot = await session.text({
    waitFor: (text) => text.includes('Basic Information') && text.includes('Metrics'),
    timeout: 15000,
  })

  // Count separator lines (groups of ─ characters)
  const separatorMatches = snapshot.match(/─{20,}/g)

  // We have 5 separators in the showcase
  expect(separatorMatches).toBeTruthy()
  expect(separatorMatches!.length).toBeGreaterThanOrEqual(5)
}, 30000)

test('detail metadata renders tag lists with multiple items', async () => {
  const snapshot = await session.text({
    waitFor: (text) => text.includes('Labels:') && text.includes('Watchers:'),
    timeout: 15000,
  })

  expect(snapshot).toMatchInlineSnapshot(`
    "




      Project Update: Q1 2024 Review

      This detail view demonstrates markdown content alongside metadata.

      ---

      Summary

      The project has made significant progress this quarter. Key highlights include:

      - Completed the new authentication system
      - Migrated 85% of users to the new platform
      - Reduced API response time by 40%

      Technical Details

      The refactoring effort focused on three main areas:

      1. Database optimization - Indexed frequently queried columns
      2. Caching layer - Added Redis for session management
      3. Code cleanup - Removed deprecated endpoints

      Next Steps

      We will continue with Phase 2 in the upcoming sprint. The team should prioritize:

      - Finishing the remaining user migrations
      - Implementing the new dashboard
      - Writing integration tests

      ---

      Last updated: January 20, 2024

      Basic Information

      Name:        Alice Johnson

      Role:        Engineer

      Team:        Platform

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Status:      Active

      Priority:    High

      Type:        Feature

      Risk:        Medium

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Description: This is a comprehensive metadata showcase that demonstrates all the different
                   ways you can display information using the Detail.Metadata component.

      File Path:   /Users/developer/projects/termcast/src/examples/detail-metadata-showcase.tsx

      Author:      Alice Johnson

      Reviewer:    Bob Smith

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Repository:  github.com/example

      Docs:        docs.example.com

      PR Link:     github.com/organization/repository/pull/12345

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Labels:      documentation enhancement good first issue

      Tags:        bug feature urgent design backend

      Timestamps

      Created:     2024-01-15 09:30:00

      Updated:     2024-01-20 14:45:00

      Due Date:    2024-02-01

      ─────────────────────────────────────────────────────────────────────────────────────────────

      Metrics

      Comments:    42

      Reactions:   +127

      Views:       1,234

      Watchers:    @alice @bob @charlie



      esc go back                                                                  powered by termcast















    "
  `)

  // Labels tag list
  expect(snapshot).toContain('Labels:')
  expect(snapshot).toContain('documentation')
  expect(snapshot).toContain('enhancement')
  expect(snapshot).toContain('good first issue')

  // Tags tag list with colors
  expect(snapshot).toContain('Tags:')
  expect(snapshot).toContain('bug')
  expect(snapshot).toContain('feature')
  expect(snapshot).toContain('urgent')
  expect(snapshot).toContain('design')
  expect(snapshot).toContain('backend')

  // Watchers tag list
  expect(snapshot).toContain('Watchers:')
  expect(snapshot).toContain('@alice')
  expect(snapshot).toContain('@bob')
  expect(snapshot).toContain('@charlie')
}, 30000)

test('detail metadata renders colored text values', async () => {
  const snapshot = await session.text({
    waitFor: (text) => text.includes('Status') && text.includes('Active') && text.includes('+127'),
    timeout: 15000,
  })

  // Verify colored values are present in output
  expect(snapshot).toContain('Active')
  expect(snapshot).toContain('High')
  expect(snapshot).toContain('Feature')
  expect(snapshot).toContain('Medium')
  expect(snapshot).toContain('+127')
  expect(snapshot).toContain('2024-02-01')

  // Verify all colored tags are present
  expect(snapshot).toContain('bug')
  expect(snapshot).toContain('feature')
  expect(snapshot).toContain('urgent')
  expect(snapshot).toContain('design')
  expect(snapshot).toContain('backend')
  expect(snapshot).toContain('@alice')
  expect(snapshot).toContain('@bob')
  expect(snapshot).toContain('@charlie')
}, 30000)
