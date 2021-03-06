import React from 'react'
import { expect, use } from 'chai'
import { default as chaiDom } from 'chai-dom'
import 'mocha'
import sinon, { SinonSpy, SinonStub } from 'sinon'
import {
  render,
  cleanup,
  screen,
  fireEvent,
  act,
  // waitFor
} from '@testing-library/react'

// configure chai to use chai-dom plugin
use(chaiDom)

import * as form from './Form'

const Form = form.Form
const sendEmail = form.sendEmail

describe('component/contact/Form', function () {
  describe('sendEmail()', function () {
    const email = 'email@email.email'
    const subject = 'subject'
    const message = 'message'
    const name = 'name'

    let mockFetch: { restore: () => void }

    interface FetchOptions {
      method: string
      headers: { [name: string]: string }
      body: string
    }

    interface Fetch {
      (location: string, options: FetchOptions): any
    }

    const setupMockFetch = (returnValue: any) => {
      const fetch: Fetch = (location, options) => {
        const res = new Promise((resolve) => {
          resolve(returnValue)
        })

        location
        options

        return res
      }

      const oldFetch = window.fetch

      const restore = () => {
        Object.defineProperty(window, 'fetch', {
          writable: true,
          configurable: true,
          value: oldFetch,
        })
      }

      Object.defineProperty(window, 'fetch', {
        writable: true,
        configurable: true,
        value: fetch,
      })

      return { restore: restore }
    }

    afterEach(function () {
      mockFetch.restore()
    })

    it('indicates if the email was sent successfully', async function () {
      // mock a successful fetch response
      mockFetch = setupMockFetch({
        ok: true,
      })

      expect(
        await sendEmail(email, subject, message, name).then(
          (result) => result.success
        )
      ).to.be.true
    })

    it('or if there was an error in sending the email', async function () {
      mockFetch = setupMockFetch({
        ok: false,
      })

      expect(
        await sendEmail(email, subject, message, name).then(
          (result) => result.success
        )
      ).to.be.false
    })

    it('and indicates if there was an error in parsing the response', async function () {
      // if the response somehow doesn't have an `ok` property,
      // the parser will throw an error
      mockFetch = setupMockFetch('value')

      expect(
        await sendEmail(email, subject, message, name).then(
          (result) => result.success
        )
      ).to.be.false
    })

    it('requires a non-empty string for the email address', async function () {
      // if the response somehow doesn't have an `ok` property,
      // the parser will throw an error
      mockFetch = setupMockFetch({
        ok: true,
      })

      expect(
        await sendEmail('', subject, message, name).then(
          (result) => result.success
        )
      ).to.be.false
    })

    it('requires a non-empty string for the message', async function () {
      // if the response somehow doesn't have an `ok` property,
      // the parser will throw an error
      mockFetch = setupMockFetch({
        ok: true,
      })

      expect(
        await sendEmail(email, subject, '', name).then(
          (result) => result.success
        )
      ).to.be.false
    })

    describe('calls fetch on the correct parameters', function () {
      let spyFetch: SinonSpy<any, any>

      before(async function () {
        mockFetch = setupMockFetch({ ok: true })
        spyFetch = sinon.spy(window, 'fetch')

        await sendEmail(email, subject, message, name)
      })

      it('URL, using a relative path', function () {
        expect(spyFetch.args[0][0]).to.equal('/reach-out')
      })

      it('method as POST', function () {
        expect(spyFetch.args[0][1]?.method).to.equal('POST')
      })

      it('Accept Header as json', function () {
        expect(spyFetch.args[0][1]?.headers).to.deep.equal({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        })
      })
    })
  })

  describe('Form', function () {
    let nameInput: HTMLInputElement
    let emailInput: HTMLInputElement
    let subjectInput: HTMLInputElement
    let messageInput: HTMLInputElement
    let humanAnswerInput: HTMLInputElement
    let submitButton: HTMLElement
    let honeypotInput: HTMLInputElement

    let sendEmailStub: SinonStub<any, any>

    const inputEvent = (element: HTMLInputElement, newValue: string) => {
      act(() => {
        fireEvent.change(element, { target: { value: newValue } })
      })
    }

    before(function () {
      sendEmailStub = sinon.stub(form, 'sendEmail')
      sendEmailStub.returns(
        Promise.resolve().then(() => ({ success: true, data: 'some data' }))
      )
    })

    beforeEach(function () {
      act(() => {
        render(<Form />)
      })

      // bad types in @testing-library/react; requires casting
      // to get .value property
      // from: https://stackoverflow.com/a/59987029/4642869
      nameInput = screen.getByLabelText(/who/i) as HTMLInputElement
      emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
      subjectInput = screen.getByLabelText(/talk about/i) as HTMLInputElement
      messageInput = screen.getByLabelText(/more/i) as HTMLInputElement
      humanAnswerInput = screen.getByLabelText('1 + 2 = ?') as HTMLInputElement
      submitButton = screen.getByRole('button', { name: 'Send' })
      honeypotInput = screen.getByTestId('honeypot') as HTMLInputElement
    })

    afterEach(function () {
      // cleanup @testing-library/react's render
      cleanup()
      // cleanup sendEmail stub history, but not behavior
      sendEmailStub.resetHistory()
    })

    after(function () {
      sendEmailStub.restore()
    })

    it('lets the user know their message was sent succesfully', async function () {
      inputEvent(nameInput, 'a name')
      inputEvent(emailInput, 'an@email.address')
      inputEvent(subjectInput, 'a subject')
      inputEvent(messageInput, 'a message')
      inputEvent(humanAnswerInput, '3')

      act(() => {
        fireEvent.click(submitButton)
      })

      const successMessage = await screen.findByText(/thanks for reaching out/i)

      expect(successMessage).to.exist
    })

    it('or if there was an error sending the message', async function () {
      // return an error result from sendEmail
      sendEmailStub.returns(
        Promise.resolve().then(() => ({ success: false, error: 'some data' }))
      )

      inputEvent(nameInput, 'a name')
      inputEvent(emailInput, 'an@email.address')
      inputEvent(messageInput, 'a message')
      inputEvent(humanAnswerInput, '3')

      act(() => {
        fireEvent.click(submitButton)
      })

      const errorMessage = await screen.findByText(/there was an error/i)

      expect(errorMessage).to.exist
    })

    it('checks if the user is a human using simple math', async function () {
      inputEvent(nameInput, 'a name')
      inputEvent(emailInput, 'an@email.address')
      inputEvent(messageInput, 'a message')

      // expects 3, three, or Three
      inputEvent(humanAnswerInput, '4')

      act(() => {
        fireEvent.click(submitButton)
      })

      const errorMessage = await screen.findByText(/are you sure you're human/i)

      expect(errorMessage).to.exist
    })

    describe('and also checks if they are human using a honeypot', function () {
      it('the field is invisible', async function () {
        expect(honeypotInput).to.have.class('hidden')
      })

      it('will appear to send a message even if the honeypot is filled out', async function () {
        inputEvent(nameInput, 'a name')
        inputEvent(emailInput, 'an@email.address')
        inputEvent(messageInput, 'a message')
        inputEvent(humanAnswerInput, '3')

        // put a value in the honeypot
        inputEvent(honeypotInput, 'any value')

        act(() => {
          fireEvent.click(submitButton)
        })

        const successMessage = await screen.findByText(
          /thanks for reaching out/i
        )

        expect(successMessage).to.exist
      })

      it("but the message actually won't have been sent", async function () {
        inputEvent(nameInput, 'a name')
        inputEvent(emailInput, 'an@email.address')
        inputEvent(messageInput, 'a message')
        inputEvent(humanAnswerInput, '3')

        // put a value in the honeypot
        inputEvent(honeypotInput, 'any value')

        act(() => {
          fireEvent.click(submitButton)
        })

        await screen.findByRole('alert')

        expect(sendEmailStub.notCalled).to.be.true
      })
    })

    // it('calls sendEmail() when the form is submitted', function () {

    // })
  })
})
