import React, { useRef } from 'react'

import { Layout, navItems, mergeRefsToItems } from '../components/Layout'
import { Section } from '../components/Section'
import { Story } from '../components/pages/story/Story'
import { Contact } from '../components/pages/contact/Contact'

export default function Landing() {
  const storyRef = useRef<HTMLDivElement>(null)
  // const projectRef = useRef<HTMLDivElement>(null)
  // const hireRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const navigationRefs = {
    story: storyRef,
    // 'featured-projects': projectRef,
    // 'hire-me': hireRef,
    contact: contactRef,
  }

  const merged = mergeRefsToItems(navItems, navigationRefs)
  return (
    <Layout navigationItems={navItems} navigationRefs={navigationRefs} landing>
      <Section ref={storyRef} id="story" title="Story" next={merged[1]}>
        <Story />
      </Section>

      {/*
      <Section
        id="featured-projects"
        title="Projects"
        ref={projectRef}
        next={merged[2]}
      >
      </Section>

      <Section id="hire-me" title="Hire Me" ref={hireRef} next={merged[3]}>
      </Section>
        */}

      <Section id="contact" title="Contact" ref={contactRef}>
        <Contact />
      </Section>
    </Layout>
  )
}