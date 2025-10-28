import { render, screen, waitFor } from '@testing-library/react'

import { UpdateProvider } from '@/components/providers/update-provider'
import { useAppVersion } from '@/hooks'

jest.mock('@/hooks', () => ({
  useAppVersion: jest.fn(),
}))

const mockUseAppVersion = useAppVersion as jest.Mock

describe('UpdateProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the update modal and triggers an automatic reload when an update is available', async () => {
    const reload = jest.fn()

    mockUseAppVersion.mockReturnValue({
      updateAvailable: true,
      reload,
      hasReloaded: false,
      dismiss: jest.fn(),
      current: { version: '1.0.0', buildTime: 't1' },
      server: { version: '1.0.1', buildTime: 't2' },
    })

    render(
      <UpdateProvider>
        <div>child</div>
      </UpdateProvider>
    )

    await waitFor(() => {
      expect(reload).toHaveBeenCalledTimes(1)
    })

    expect(screen.getByText('updates.title')).toBeInTheDocument()
    expect(screen.getByText('updates.description')).toBeInTheDocument()
  })

  it('does not trigger multiple reloads when the flag indicates it already reloaded', async () => {
    const reload = jest.fn()

    mockUseAppVersion.mockReturnValue({
      updateAvailable: true,
      reload,
      hasReloaded: true,
      dismiss: jest.fn(),
      current: { version: '1.0.0', buildTime: 't1' },
      server: { version: '1.0.1', buildTime: 't2' },
    })

    render(
      <UpdateProvider>
        <div>child</div>
      </UpdateProvider>
    )

    await waitFor(() => {
      expect(reload).not.toHaveBeenCalled()
    })
  })
})
