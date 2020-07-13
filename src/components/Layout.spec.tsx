import React, { MutableRefObject } from 'react'
import { expect } from 'chai'
import 'mocha'
import { shallow, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

import { Layout, mergeRefsToItems } from './Layout'
import { Landing } from './pages/Landing'
import { Header } from './header/Header'
import { AnchorLink } from './navigation/AnchorLink'

describe('component/Layout', () => {
  const navItems = [
    {
      to: '/#first',
      text: 'First',
      key: 'first',
    },
    {
      to: '/#second',
      text: 'Second',
      key: 'second',
    },
  ]
  describe('#content', () => {
    const children = (
      <div>
        <div className="child">This is a child</div>
        <div className="child">Another child</div>
      </div>
    )
    const content = shallow(
      <Layout navigationItems={navItems} pageTitle="Test">
        {children}
      </Layout>
    )

    it('renders child elements', () => {
      expect(content.find('div.child')).to.have.lengthOf(2)
    })

    it('allows users to skip to main content', () => {
      // test run against AnchorLink's to property since Layout doesn't know about
      // AnchorLink's internal implementation
      expect(content.find(AnchorLink).props().to).to.equal('#main-content')
    })
  })

  describe('#landing & /#header', () => {
    const layout = shallow(
      <Layout navigationItems={navItems} pageTitle="Test" landing></Layout>
    )

    it('optionally renders a Landing', () => {
      expect(layout.find(Landing)).to.have.lengthOf(1)
    })

    it('and that landing is before the Header', () => {
      expect(layout.childAt(1).type()).to.equal(Landing)
      expect(layout.childAt(2).type()).to.equal(Header)
    })

    it('navigation configuration is defined in Layout as an array of MenuItems', () => {
      const layout = shallow(
        <Layout navigationItems={navItems}>A child goes here</Layout>
      )
      expect(layout.find(Header).get(0).props.navigationItems).to.eql(navItems)
    })

    it("can match React Refs to navigation items by the item's key value", () => {
      const refs = {
        first: ('actually a ref' as any) as MutableRefObject<any>,
      }

      expect(mergeRefsToItems(navItems, refs)[0].targetRef).to.exist
      expect(mergeRefsToItems(navItems, refs)[1].targetRef).to.not.exist
    })
  })
})
