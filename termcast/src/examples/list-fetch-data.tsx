import React, { useState, useEffect } from 'react'
import { List, showToast, Toast } from 'termcast'
import { renderWithProviders } from 'termcast/src/utils'

interface Category {
  category: string
  total: number
}

interface SvgItem {
  id: number
  title: string
  category: string
  route: string | { light: string; dark: string }
}

// Simulated fetch functions
async function fetchCategories(): Promise<Category[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { category: 'Icons', total: 3 },
        { category: 'Illustrations', total: 2 },
      ])
    }, 100)
  })
}

async function fetchSvgs(): Promise<SvgItem[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          title: 'Home Icon',
          category: 'Icons',
          route: '/icons/home.svg',
        },
        {
          id: 2,
          title: 'User Icon',
          category: 'Icons',
          route: '/icons/user.svg',
        },
        {
          id: 3,
          title: 'Settings Icon',
          category: 'Icons',
          route: '/icons/settings.svg',
        },
        {
          id: 4,
          title: 'Welcome Banner',
          category: 'Illustrations',
          route: '/illustrations/welcome.svg',
        },
        {
          id: 5,
          title: 'Hero Image',
          category: 'Illustrations',
          route: '/illustrations/hero.svg',
        },
      ])
    }, 100)
  })
}

const AllList = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [svgs, setSvgs] = useState<SvgItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const svgs = await fetchSvgs()
        const categories = await fetchCategories()
        setSvgs(svgs)
        setCategories(categories)
      } catch (error) {
        if (error instanceof Error) {
          await showToast({
            style: Toast.Style.Failure,
            title: 'Loading Failed',
            message: error.message,
          })
        }
      }
      setIsLoading(false)
    }
    fetchData()
  }, [])

  return (
    <List navigationTitle='SVG Library' isLoading={isLoading}>
      {categories.map((category, index) => {
        const categoryItems = svgs.filter(
          (svg) =>
            svg.category === category.category ||
            svg.category?.includes(category.category),
        )
        return (
          <List.Section
            title={category.category}
            subtitle={category.total.toString()}
            key={String(index)}
          >
            {categoryItems.map((svg) => (
              <List.Item
                key={String(svg.id)}
                title={svg.title}
                subtitle={`Category: ${svg.category}`}
              />
            ))}
          </List.Section>
        )
      })}
    </List>
  )
}

renderWithProviders(<AllList />)
