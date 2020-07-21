import React, { RefObject } from 'react'

import styles from './Layout.module.sass'

import { Landing } from './pages/Landing'
import { Header } from './header/Header'
import { MenuItem } from './navigation/NavMenu'
import { AnchorLink } from './navigation/AnchorLink'

// import utils from '../utils'

export const navItems: MenuItem[] = [
  {
    to: '/#about',
    text: 'About',
    key: 'about',
  },
  {
    to: '/#featured-projects',
    text: 'Projects',
    key: 'featured-projects',
  },
  {
    to: '/#hire-me',
    text: 'Hire Me',
    key: 'hire-me',
  },
  {
    to: '/#contact-me',
    text: 'Contact Me',
    key: 'contact-me',
  },
  {
    to: '/blog',
    text: 'Blog',
    key: 'blog',
  },
]

export interface NavigationRefs {
  [name: string]: RefObject<HTMLDivElement>
}

export const mergeRefsToItems = (items: MenuItem[], refs: NavigationRefs) => {
  // merge a hashmap of navigation refs to the navigation items
  // by key before passing to Header
  return items.map((item) => {
    if (refs[item.key]) {
      item.targetRef = refs[item.key]
    }
    return item
  })
}

interface Props {
  navigationItems: MenuItem[]
  pageTitle: string | null
  landing: boolean
  navigationRefs: NavigationRefs
}

interface State {
  headerPosition: number
  headerIsStickied: boolean
}

export class Layout extends React.Component<Props, State> {
  mainContentRef: RefObject<HTMLDivElement>
  headerRef: RefObject<HTMLDivElement>
  mergedRefsAndItems: MenuItem[]

  static defaultProps = {
    pageTitle: null,
    landing: false,
    navigationRefs: {},
  }

  constructor(props: Props) {
    super(props)

    this.mainContentRef = React.createRef<HTMLDivElement>()
    this.mergedRefsAndItems = mergeRefsToItems(
      props.navigationItems,
      props.navigationRefs
    )

    this.headerRef = React.createRef<HTMLDivElement>()

    this.state = {
      // init w/ junk value, will get actual on mount
      headerPosition: -1,
      headerIsStickied: false,
    }
  }

  headerObserver = (entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      this.setState({
        headerPosition: entry.boundingClientRect.top,
      })
    })
  }

  componentDidMount = () => {
    if (this.headerRef.current) {
      new window.IntersectionObserver(this.headerObserver, {
        rootMargin: '0px',
        threshold: [0],
      }).observe(this.headerRef.current)
    }
  }

  render() {
    return (
      <div>
        <AnchorLink
          to="#main-content"
          id="skip-to-main-content"
          className={styles.mainContentLink}
          target={this.mainContentRef}
        >
          Skip to main content
        </AnchorLink>
        {this.props.landing ? <Landing /> : null}
        {/*create dummy div for header ref*/}
        <div ref={this.headerRef}></div>
        <Header
          navigationItems={this.mergedRefsAndItems}
          brandingVisibility={this.state.headerPosition > 0 ? false : true}
        />
        <div
          id="main-content"
          className={styles.content}
          tabIndex={-1}
          ref={this.mainContentRef}
        >
          {this.props.pageTitle ? (
            <h1 className="title">{this.props.pageTitle}</h1>
          ) : null}
          {this.props.children}
        </div>
      </div>
    )
  }
}
