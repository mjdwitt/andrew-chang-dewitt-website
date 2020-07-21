import React, { RefObject, MutableRefObject } from 'react'
import { expect } from 'chai'
import 'mocha'
import { mount, shallow, configure, ShallowWrapper } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import sinon, { SinonStub, SinonSpy } from 'sinon'

import testUtils from '../testUtils'

configure({ adapter: new Adapter() })

import { Layout, NavigationRefs, mergeRefsToItems } from './Layout'

import { Landing } from './pages/Landing'
import { Header } from './header/Header'
import { MenuItem } from './navigation/NavMenu'
import { AnchorLink } from './navigation/AnchorLink'

import * as router from '@reach/router'

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
    {
      to: '/other-page',
      text: 'Other page',
      key: 'other-page',
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
      <Layout navigationItems={navItems}>{children}</Layout>
    )

    it('renders child elements', () => {
      expect(content.find('div.child')).to.have.lengthOf(2)
    })

    it('allows users to skip to main content', () => {
      // test run against AnchorLink's to property since Layout doesn't know about
      // AnchorLink's internal implementation
      expect(content.find(AnchorLink).props().to).to.equal('#main-content')
    })

    it('defaults to not rendering a page title in the content section', () => {
      expect(content.find('#main-content').first().children().first().is('h1'))
        .to.be.false
    })

    it('but can be told to render a given page title as the first node in the content section', () => {
      const title = shallow(
        <Layout navigationItems={navItems} pageTitle="Test">
          {children}
        </Layout>
      )
        .find('#main-content')
        .first()
        .children()
        .first()

      expect(title.is('h1')).to.be.true
      expect(title.props().children).to.equal('Test')
    })
  })

  describe('#landing', () => {
    const layout = shallow(<Layout navigationItems={navItems} landing></Layout>)

    it('optionally renders a Landing', () => {
      expect(layout.find(Landing)).to.have.lengthOf(1)
    })

    it('and that landing is before the Header', () => {
      expect(layout.childAt(1).type()).to.equal(Landing)
      expect(layout.childAt(3).type()).to.equal(Header)
    })
  })

  describe('#header', () => {
    const layout = shallow(<Layout navigationItems={navItems} landing />)

    it('navigation configuration is defined in Layout as an array of MenuItems', () => {
      expect(layout.find(Header).get(0).props.navigationItems).to.eql(navItems)
    })

    it("can match React Refs to navigation items by the item's key value", () => {
      const refs = {
        first: ('actually a ref' as any) as MutableRefObject<any>,
      }

      expect(mergeRefsToItems(navItems, refs)[0].targetRef).to.exist
      expect(mergeRefsToItems(navItems, refs)[1].targetRef).to.not.exist
    })

    it('sets brandingVisibility to false if header position is > 0', () => {
      layout.setState({ headerPosition: 1 })

      expect(layout.find(Header).first().props().brandingVisibility).to.be.false
    })

    it('sets brandingVisibility to true if header position is == 0', () => {
      layout.setState({ headerPosition: 0 })

      expect(layout.find(Header).first().props().brandingVisibility).to.be.true
    })

    describe('scroll behavior', () => {
      let intersectionObserverSpy: SinonSpy

      interface MockIntersectionObserver {
        restore: () => void
      }
      let mockIntersectionObserver: MockIntersectionObserver
      // Mocking Intersection Observer behaviour
      const setupIntersectionObserverMock = (
        observe: SinonStub | (() => null) = () => null,
        unobserve: SinonStub | (() => null) = () => null
      ): MockIntersectionObserver => {
        class IntersectionObserver {
          observe = observe
          unobserve = unobserve
        }

        const oldIntObv = IntersectionObserver ? IntersectionObserver : null

        const restore = () => {
          Object.defineProperty(window, 'IntersectionObserver', {
            writable: true,
            configurable: true,
            value: oldIntObv,
          })
          Object.defineProperty(global, 'IntersectionObserver', {
            writable: true,
            configurable: true,
            value: oldIntObv,
          })
        }

        Object.defineProperty(window, 'IntersectionObserver', {
          writable: true,
          configurable: true,
          value: IntersectionObserver,
        })
        Object.defineProperty(global, 'IntersectionObserver', {
          writable: true,
          configurable: true,
          value: IntersectionObserver,
        })

        return { restore: restore }
      }

      let createRefStub: SinonStub<any, any>

      let scrollTest: ShallowWrapper
      let instance: Layout

      describe('#branding-area', () => {
        beforeEach(() => {
          mockIntersectionObserver = setupIntersectionObserverMock()

          intersectionObserverSpy = sinon.spy(window, 'IntersectionObserver')

          // stub React's ref behaviour
          createRefStub = sinon.stub(React, 'createRef')
          createRefStub.returns({ current: true })

          // Enzme
          scrollTest = shallow(<Layout navigationItems={navItems}></Layout>)

          // manually invoke mounting because Enzyme won't
          // https://stackoverflow.com/a/46513933
          // must be guarded as componenet did mount is not
          // guarnteed to exist on ShallowWrapper.instance()
          // https://stackoverflow.com/a/52706587
          instance = scrollTest.instance() as Layout

          // gatsby's internal Link implementation relies on a global __BASE_PATH__ variable
          // solution from:
          // https://mariusschulz.com/blog/declaring-global-variables-in-typescript#using-a-type-assertion
          // using a type assertion on the global object allows adding properties
          // to the object without typescript complaining. Hacky, but since this is
          // to get a test to work without the gatsby environment, it's fine
          ;(global as any).__BASE_PATH__ = ''
          // solution to `ReferenceError: __loader is not defined` from
          // https://github.com/gatsbyjs/gatsby/issues/6240#issuecomment-408627563
          ;(global as any).___loader = {
            enqueue: sinon.fake(),
          }
        })
        afterEach(() => {
          intersectionObserverSpy.resetHistory()
          mockIntersectionObserver.restore()
          createRefStub.restore()

          // cleanup global namespace
          delete (global as any).__loader
        })

        it('uses IntersectionObserver to call headerObserver', () => {
          const source = testUtils.createBetterSource()
          const history = router.createHistory(source)

          mount(
            <router.LocationProvider history={history}>
              <Layout navigationItems={navItems} landing>
                <div style={{ height: 1000 }}></div>
              </Layout>
            </router.LocationProvider>
          )

          const callbackExpected = instance.headerObserver
          const callbackActualIsExpected = intersectionObserverSpy.args.reduce(
            (result, current) => {
              if (result) return result
              else return current[0] === callbackExpected
            },
            false
          )
          expect(callbackActualIsExpected).to.be.true
        })

        it('calls headerObserver if the element reaches viewport top', () => {
          const source = testUtils.createBetterSource()
          const history = router.createHistory(source)

          mount(
            <router.LocationProvider history={history}>
              <Layout navigationItems={navItems} landing>
                <div style={{ height: 1000 }}></div>
              </Layout>
            </router.LocationProvider>
          )

          const callbackExpected = instance.headerObserver
          const intObvOptions = intersectionObserverSpy.args.reduce(
            (result, current) => {
              if (current[0] === callbackExpected) return current[1]
              else return result
            },
            { rootMargin: 'null', threshold: [1] }
          )
          expect(intObvOptions.rootMargin).to.equal('0px')
          expect(intObvOptions.threshold[0]).to.equal(0)
          expect(intObvOptions.threshold).to.have.lengthOf(1)
        })

        it('headerObserver updates state.headerPosition', () => {
          const mockEntries = [
            {
              boundingClientRect: {
                top: 1,
              },
            },
          ] as IntersectionObserverEntry[]

          instance.headerObserver(mockEntries)

          expect(scrollTest.state('headerPosition')).to.eq(1)
        })
      })

      describe('active tab status', () => {
        let observeStub: SinonStub
        let unobserveStub: SinonStub

        const mockRef1 = ({
          current: 'first',
        } as any) as RefObject<HTMLDivElement>
        const mockRef2 = ({
          current: 'second',
        } as any) as RefObject<HTMLDivElement>

        const navRefs: NavigationRefs = {
          first: mockRef1,
          second: mockRef2,
        }

        beforeEach(() => {
          observeStub = sinon.stub() //.callsFake((observer) => observer())
          unobserveStub = sinon.stub() //.callsFake((unobserver) => unobserver())
          mockIntersectionObserver = setupIntersectionObserverMock(
            observeStub,
            unobserveStub
          )

          intersectionObserverSpy = sinon.spy(window, 'IntersectionObserver')

          // stub React's ref behaviour
          createRefStub = sinon.stub(React, 'createRef')
          createRefStub.returns({ current: true })

          // Enzme
          scrollTest = shallow(
            <Layout
              navigationItems={navItems}
              navigationRefs={navRefs}
              landing
            ></Layout>
          )

          // manually invoke mounting because Enzyme won't
          // https://stackoverflow.com/a/46513933
          // must be guarded as componenet did mount is not
          // guarnteed to exist on ShallowWrapper.instance()
          // https://stackoverflow.com/a/52706587
          instance = scrollTest.instance() as Layout

          // gatsby's internal Link implementation relies on a global __BASE_PATH__ variable
          // solution from:
          // https://mariusschulz.com/blog/declaring-global-variables-in-typescript#using-a-type-assertion
          // using a type assertion on the global object allows adding properties
          // to the object without typescript complaining. Hacky, but since this is
          // to get a test to work without the gatsby environment, it's fine
          ;(global as any).__BASE_PATH__ = ''
          // solution to `ReferenceError: __loader is not defined` from
          // https://github.com/gatsbyjs/gatsby/issues/6240#issuecomment-408627563
          ;(global as any).___loader = {
            enqueue: sinon.fake(),
          }
        })
        afterEach(() => {
          observeStub.resetHistory()
          unobserveStub.resetHistory()
          intersectionObserverSpy.resetHistory()
          mockIntersectionObserver.restore()
          createRefStub.restore()

          // cleanup global namespace
          delete (global as any).__loader
        })

        it('watches section positions using IntersectionObserver', () => {
          const source = testUtils.createBetterSource()
          const history = router.createHistory(source)

          mount(
            <router.LocationProvider history={history}>
              <Layout
                navigationItems={navItems}
                navigationRefs={navRefs}
                landing
              >
                <div style={{ height: 1000 }}></div>
              </Layout>
            </router.LocationProvider>
          )

          const callbackExpected = instance.sectionObserver
          const callbackActualIsExpected = intersectionObserverSpy.args.reduce(
            (result, current) => {
              if (result) return result
              else return current[0] === callbackExpected
            },
            false
          )
          expect(callbackActualIsExpected).to.be.true
        })

        it('sectionObserver changes the active tab to the currently intersecting section', () => {
          const mockViewportHeight = sinon.stub(window, 'innerHeight')
          mockViewportHeight.returns(100)

          const mockEntries = ([
            {
              isIntersecting: true,
              target: 'first',
            },
            {
              isIntersecting: false,
              target: 'second',
            },
          ] as any) as IntersectionObserverEntry[]

          instance.sectionObserver(mockEntries)

          const actualNavItems: MenuItem[] = scrollTest.state('navigationItems')

          expect(actualNavItems[0].active).to.be.true
          expect(actualNavItems[1].active).to.be.false

          mockViewportHeight.restore()
        })
      })
    })
  })
})
