import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { IconPicker } from '../components/IconPicker'
import type { RenderFieldExtensionCtx } from 'datocms-plugin-sdk'

// Mock datocms-react-ui Canvas to just render children
vi.mock('datocms-react-ui', async () => {
  const actual = await vi.importActual('datocms-react-ui')
  return {
    ...actual,
    Canvas: ({ children }: { children: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  }
})

// Mock fetch for categories API
vi.stubGlobal('fetch', vi.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({
      'a-arrow-down': ['arrows'],
      'a-arrow-up': ['arrows'],
      'accessibility': ['accessibility', 'medical'],
    }),
  })
))

function createMockCtx(overrides: Partial<RenderFieldExtensionCtx> = {}): RenderFieldExtensionCtx {
  return {
    fieldPath: 'icon',
    formValues: { icon: null },
    setFieldValue: vi.fn(),
    field: { attributes: { api_key: 'icon' } },
    itemType: { attributes: { api_key: 'test' } },
    ...overrides,
  } as unknown as RenderFieldExtensionCtx
}

describe('IconPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('renders with no icon selected', async () => {
    const ctx = createMockCtx()
    render(<IconPicker ctx={ctx} />)

    expect(screen.getByText('No icon selected')).toBeInTheDocument()
  })

  it('renders with a pre-selected icon', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:a-arrow-down' },
    })
    render(<IconPicker ctx={ctx} />)

    expect(screen.getByText('a-arrow-down')).toBeInTheDocument()
    expect(screen.getByText('lucide:a-arrow-down')).toBeInTheDocument()
  })

  it('shows picker when no icon is selected', async () => {
    const ctx = createMockCtx()
    render(<IconPicker ctx={ctx} />)

    // Use getAllByPlaceholderText and check length
    const searchInputs = screen.getAllByPlaceholderText('Search icons...')
    expect(searchInputs.length).toBeGreaterThan(0)
  })

  it('hides picker when icon is selected', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:a-arrow-down' },
    })
    render(<IconPicker ctx={ctx} />)

    // Picker should be hidden, but change button should be visible
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument()
    expect(screen.queryAllByPlaceholderText('Search icons...').length).toBe(0)
  })

  it('selects an icon and updates UI', async () => {
    const setFieldValue = vi.fn()
    const ctx = createMockCtx({ setFieldValue })
    render(<IconPicker ctx={ctx} />)

    // Find the first icon button
    const iconButtons = await screen.findAllByTitle('AArrowDown')
    expect(iconButtons.length).toBeGreaterThan(0)

    // Click it
    fireEvent.click(iconButtons[0])

    // setFieldValue should be called
    expect(setFieldValue).toHaveBeenCalledWith('icon', 'lucide:a-arrow-down')

    // UI should update to show the selected icon
    await waitFor(() => {
      expect(screen.getByText('a-arrow-down')).toBeInTheDocument()
    })
  })

  it('clears icon when Remove is clicked', async () => {
    const setFieldValue = vi.fn()
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:a-arrow-down' },
      setFieldValue,
    })
    render(<IconPicker ctx={ctx} />)

    // Click Remove
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    // setFieldValue should be called with null
    expect(setFieldValue).toHaveBeenCalledWith('icon', null)

    // UI should update
    await waitFor(() => {
      expect(screen.getByText('No icon selected')).toBeInTheDocument()
    })
  })

  it('filters icons by search', async () => {
    const ctx = createMockCtx()
    render(<IconPicker ctx={ctx} />)

    // Get search input
    const searchInputs = screen.getAllByPlaceholderText('Search icons...')
    fireEvent.change(searchInputs[0], { target: { value: 'accessibility' } })

    // Should find Accessibility icon
    await waitFor(() => {
      const accessibilityIcons = screen.getAllByTitle('Accessibility')
      expect(accessibilityIcons.length).toBeGreaterThan(0)
    })
  })

  it('expands picker when Change is clicked', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:a-arrow-down' },
    })
    render(<IconPicker ctx={ctx} />)

    // Initially no search input (picker collapsed)
    expect(screen.queryAllByPlaceholderText('Search icons...').length).toBe(0)

    // Click Change
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))

    // Now picker should be visible
    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Search icons...').length).toBeGreaterThan(0)
    })
  })

  it('persists selection after clicking Change', async () => {
    const setFieldValue = vi.fn()
    const ctx = createMockCtx({ setFieldValue })
    render(<IconPicker ctx={ctx} />)

    // Select an icon
    const iconButtons = await screen.findAllByTitle('AArrowDown')
    fireEvent.click(iconButtons[0])

    // Verify selection
    await waitFor(() => {
      expect(screen.getByText('a-arrow-down')).toBeInTheDocument()
    })

    // Click Change
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))

    // Selection should still be visible at top
    expect(screen.getByText('a-arrow-down')).toBeInTheDocument()
    expect(screen.getByText('lucide:a-arrow-down')).toBeInTheDocument()
  })
})
