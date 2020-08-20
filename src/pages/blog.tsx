import React from 'react'
import { graphql } from 'gatsby'

import { Layout, navItems } from '../components/Layout'
import { BlogHome, Post } from '../components/pages/BlogHome'

interface Props {
  // FIXME: find proper type for this
  data: any
}

const Blog = (props: Props) => {
  const posts = props.data.allMarkdownRemark.edges.map(
    ({ node }: any): Post => {
      return {
        id: node.id,
        title: node.frontmatter.title,
        date: node.frontmatter.date,
        slug: node.fields.slug,
        excerpt: node.excerpt,
      }
    }
  )

  return (
    <Layout navigationItems={navItems}>
      <BlogHome posts={posts} />
    </Layout>
  )
}

export const query = graphql`
  query {
    allMarkdownRemark(sort: { fields: [frontmatter___date], order: DESC }) {
      edges {
        node {
          id
          frontmatter {
            title
            date(formatString: "DD MMMM, YYYY")
          }
          fields {
            slug
          }
          excerpt
        }
      }
    }
  }
`

export default Blog
