/**
 * Comprehensive Detail.Metadata showcase demonstrating all metadata features:
 * - Labels (short/long values, colored text, header-only)
 * - Separators between groups
 * - Groups without separators
 * - Links (short and long)
 * - TagList with colored tags
 * - Various Color enum values
 */

import React from 'react'
import { Detail, Color } from 'termcast'
import { renderWithProviders } from '../utils'

const DetailMetadataShowcase = () => {
  return (
    <Detail
      navigationTitle="Metadata Showcase"
      markdown={`# Project Update: Q1 2024 Review

This detail view demonstrates markdown content alongside metadata.

---

## Summary

The project has made significant progress this quarter. Key highlights include:

- Completed the new authentication system
- Migrated 85% of users to the new platform
- Reduced API response time by 40%

## Technical Details

The refactoring effort focused on three main areas:

1. **Database optimization** - Indexed frequently queried columns
2. **Caching layer** - Added Redis for session management  
3. **Code cleanup** - Removed deprecated endpoints

## Next Steps

We will continue with Phase 2 in the upcoming sprint. The team should prioritize:

- Finishing the remaining user migrations
- Implementing the new dashboard
- Writing integration tests

---

*Last updated: January 20, 2024*`}
      metadata={
        <Detail.Metadata>
          {/* Header label (title only, no text) */}
          <Detail.Metadata.Label title="Basic Information" />
          
          {/* Short values - row layout */}
          <Detail.Metadata.Label title="Name" text="Alice Johnson" />
          <Detail.Metadata.Label title="Role" text="Engineer" />
          <Detail.Metadata.Label title="Team" text="Platform" />
          
          <Detail.Metadata.Separator />
          
          {/* Colored text values */}
          <Detail.Metadata.Label title="Status" text={{ value: "Active", color: Color.Green }} />
          <Detail.Metadata.Label title="Priority" text={{ value: "High", color: Color.Red }} />
          <Detail.Metadata.Label title="Type" text={{ value: "Feature", color: Color.Blue }} />
          <Detail.Metadata.Label title="Risk" text={{ value: "Medium", color: Color.Orange }} />
          
          <Detail.Metadata.Separator />
          
          {/* Long values - column layout */}
          <Detail.Metadata.Label 
            title="Description" 
            text="This is a comprehensive metadata showcase that demonstrates all the different ways you can display information using the Detail.Metadata component." 
          />
          <Detail.Metadata.Label 
            title="File Path" 
            text="/Users/developer/projects/termcast/src/examples/detail-metadata-showcase.tsx" 
          />
          
          {/* No separator here - grouping without visual break */}
          <Detail.Metadata.Label title="Author" text="Alice Johnson" />
          <Detail.Metadata.Label title="Reviewer" text="Bob Smith" />
          
          <Detail.Metadata.Separator />
          
          {/* Links - short */}
          <Detail.Metadata.Link 
            title="Repository" 
            target="https://github.com/example/repo" 
            text="github.com/example" 
          />
          <Detail.Metadata.Link 
            title="Docs" 
            target="https://docs.example.com" 
            text="docs.example.com" 
          />
          
          {/* Link - long (column layout) */}
          <Detail.Metadata.Link 
            title="PR Link" 
            target="https://github.com/organization/repository/pull/12345" 
            text="github.com/organization/repository/pull/12345" 
          />
          
          <Detail.Metadata.Separator />
          
          {/* TagList with plain tags */}
          <Detail.Metadata.TagList title="Labels">
            <Detail.Metadata.TagList.Item text="documentation" />
            <Detail.Metadata.TagList.Item text="enhancement" />
            <Detail.Metadata.TagList.Item text="good first issue" />
          </Detail.Metadata.TagList>
          
          {/* TagList with colored tags */}
          <Detail.Metadata.TagList title="Tags">
            <Detail.Metadata.TagList.Item text="bug" color={Color.Red} />
            <Detail.Metadata.TagList.Item text="feature" color={Color.Green} />
            <Detail.Metadata.TagList.Item text="urgent" color={Color.Orange} />
            <Detail.Metadata.TagList.Item text="design" color={Color.Purple} />
            <Detail.Metadata.TagList.Item text="backend" color={Color.Blue} />
          </Detail.Metadata.TagList>
          
          {/* Another header without separator */}
          <Detail.Metadata.Label title="Timestamps" />
          <Detail.Metadata.Label title="Created" text="2024-01-15 09:30:00" />
          <Detail.Metadata.Label title="Updated" text="2024-01-20 14:45:00" />
          <Detail.Metadata.Label title="Due Date" text={{ value: "2024-02-01", color: Color.Yellow }} />
          
          <Detail.Metadata.Separator />
          
          {/* Mixed content without separators */}
          <Detail.Metadata.Label title="Metrics" />
          <Detail.Metadata.Label title="Comments" text="42" />
          <Detail.Metadata.Label title="Reactions" text={{ value: "+127", color: Color.Green }} />
          <Detail.Metadata.Label title="Views" text="1,234" />
          <Detail.Metadata.TagList title="Watchers">
            <Detail.Metadata.TagList.Item text="@alice" color={Color.Magenta} />
            <Detail.Metadata.TagList.Item text="@bob" color={Color.Magenta} />
            <Detail.Metadata.TagList.Item text="@charlie" color={Color.Magenta} />
          </Detail.Metadata.TagList>
        </Detail.Metadata>
      }
    />
  )
}

await renderWithProviders(<DetailMetadataShowcase />)
