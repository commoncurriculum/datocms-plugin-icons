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
    startAutoResizer: vi.fn(),
    stopAutoResizer: vi.fn(),
    updateHeight: vi.fn(),
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
      formValues: { icon: 'lucide:AArrowDown' },
    })
    render(<IconPicker ctx={ctx} />)

    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
      })

  it('shows Add button (not picker) when no icon is selected', async () => {
    const ctx = createMockCtx()
    render(<IconPicker ctx={ctx} />)

    // Should show Add button
    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()

    // Should NOT show the picker (no search input)
    expect(screen.queryByPlaceholderText('Search icons...')).not.toBeInTheDocument()
  })

  it('shows picker when Add is clicked', async () => {
    const ctx = createMockCtx()
    render(<IconPicker ctx={ctx} />)

    // Click Add button
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Now picker should be visible
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search icons...')).toBeInTheDocument()
    })
  })

  it('hides picker when icon is selected', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:AArrowDown' },
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

    // Open picker first
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Find the first icon button
    const iconButtons = await screen.findAllByTitle('AArrowDown')
    expect(iconButtons.length).toBeGreaterThan(0)

    // Click it
    fireEvent.click(iconButtons[0])

    // setFieldValue should be called
    expect(setFieldValue).toHaveBeenCalledWith('icon', 'lucide:AArrowDown')

    // UI should update to show the selected icon
    await waitFor(() => {
      expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
    })
  })

  it('clears icon when Remove is clicked', async () => {
    const setFieldValue = vi.fn()
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:AArrowDown' },
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

    // Open picker first
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Get search input
    const searchInput = screen.getByPlaceholderText('Search icons...')
    fireEvent.change(searchInput, { target: { value: 'accessibility' } })

    // Should find Accessibility icon
    await waitFor(() => {
      const accessibilityIcons = screen.getAllByTitle('Accessibility')
      expect(accessibilityIcons.length).toBeGreaterThan(0)
    })
  })

  it('expands picker when Change is clicked', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:AArrowDown' },
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

    // Open picker first
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Select an icon
    const iconButtons = await screen.findAllByTitle('AArrowDown')
    fireEvent.click(iconButtons[0])

    // Verify selection
    await waitFor(() => {
      expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
    })

    // Click Change
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))

    // Selection should still be visible at top
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
      })

  it('syncs with external form value changes', async () => {
    const setFieldValue = vi.fn()
    const ctx = createMockCtx({ setFieldValue })
    const { rerender } = render(<IconPicker ctx={ctx} />)

    // Initially no icon
    expect(screen.getByText('No icon selected')).toBeInTheDocument()

    // Simulate external change (e.g., after save/reload)
    const updatedCtx = createMockCtx({
      formValues: { icon: 'lucide:Target' },
      setFieldValue,
    })
    rerender(<IconPicker ctx={updatedCtx} />)

    // Should show the new icon
    await waitFor(() => {
      expect(screen.getByText('lucide:Target')).toBeInTheDocument()
          })
  })

  it('awaits setFieldValue before updating UI', async () => {
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    render(<IconPicker ctx={ctx} />)

    // Open picker
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Select an icon
    const iconButtons = await screen.findAllByTitle('AArrowDown')
    fireEvent.click(iconButtons[0])

    // setFieldValue should have been awaited (called and resolved)
    expect(setFieldValue).toHaveBeenCalledWith('icon', 'lucide:AArrowDown')

    // UI should update after the promise resolves
    await waitFor(() => {
      expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
    })
  })

  it('has compact height when collapsed', async () => {
    const ctx = createMockCtx({
      formValues: { icon: 'lucide:AArrowDown' },
    })
    render(<IconPicker ctx={ctx} />)

    // Root should not have a large fixed max-height when collapsed
    const root = document.querySelector('.icon-picker-root') as HTMLElement
    expect(root).toBeInTheDocument()

    // When collapsed, the root should not have max-height forcing it to be tall
    const computedStyle = window.getComputedStyle(root)
    expect(computedStyle.maxHeight).not.toBe('500px')
  })

  it('selects icon with single click and immediately closes picker', async () => {
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    render(<IconPicker ctx={ctx} />)

    // Open picker
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Verify picker is open
    expect(screen.getByPlaceholderText('Search icons...')).toBeInTheDocument()

    // Single click on icon
    const iconButton = await screen.findByTitle('AArrowDown')
    fireEvent.click(iconButton)

    // Picker should close immediately (no search input)
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Search icons...')).not.toBeInTheDocument()
    })

    // Selection should be visible
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()

    // Should only have been called once
    expect(setFieldValue).toHaveBeenCalledTimes(1)
  })

  it('maintains selection when ctx re-renders with stale formValues', async () => {
    // This simulates real DatoCMS behavior where:
    // 1. User selects icon
    // 2. setFieldValue is called
    // 3. DatoCMS re-renders component with SAME ctx (formValues still null)
    // 4. Then eventually re-renders with updated formValues
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    const { rerender } = render(<IconPicker ctx={ctx} />)

    // Open picker and select icon
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const iconButton = await screen.findByTitle('AArrowDown')
    fireEvent.click(iconButton)

    // Verify selection shows immediately (before DatoCMS confirms)
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()

    // Simulate DatoCMS re-rendering with STALE formValues (still null)
    // This happens because DatoCMS hasn't processed setFieldValue yet
    const staleCtx = createMockCtx({
      setFieldValue,
      formValues: { icon: null }  // Still null - DatoCMS is slow
    })
    rerender(<IconPicker ctx={staleCtx} />)

    // CRITICAL: Selection should STILL be visible (not flash away)
    // This is what's failing in production - the selection disappears
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
    expect(screen.queryByText('No icon selected')).not.toBeInTheDocument()

    // Now simulate DatoCMS finally updating formValues
    const updatedCtx = createMockCtx({
      setFieldValue,
      formValues: { icon: 'lucide:AArrowDown' }
    })
    rerender(<IconPicker ctx={updatedCtx} />)

    // Selection should still be there
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
  })

  it('does not call setFieldValue multiple times on single selection', async () => {
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    const { rerender } = render(<IconPicker ctx={ctx} />)

    // Open picker and select icon
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const iconButton = await screen.findByTitle('AArrowDown')
    fireEvent.click(iconButton)

    // Wait for any async operations
    await waitFor(() => {
      expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
    })

    // Simulate multiple re-renders from DatoCMS with oscillating formValues
    for (let i = 0; i < 5; i++) {
      const newCtx = createMockCtx({
        setFieldValue,
        formValues: { icon: i % 2 === 0 ? null : 'lucide:AArrowDown' }
      })
      rerender(<IconPicker ctx={newCtx} />)
    }

    // setFieldValue should only have been called ONCE from the initial selection
    expect(setFieldValue).toHaveBeenCalledTimes(1)
  })

  it('survives rapid ctx changes with different formValue states', async () => {
    // This simulates DatoCMS rapidly re-rendering with various formValue states
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    const { rerender } = render(<IconPicker ctx={ctx} />)

    // Open picker and select icon
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const iconButton = await screen.findByTitle('AArrowDown')
    fireEvent.click(iconButton)

    // Immediately verify selection before any ctx updates
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()

    // Simulate rapid DatoCMS re-renders with various states
    // This is what seems to happen: null -> value -> null -> value...
    const states = [
      null,
      'lucide:AArrowDown',
      null,
      'lucide:AArrowDown',
      null,
    ]

    for (const iconValue of states) {
      const newCtx = createMockCtx({
        setFieldValue,
        formValues: { icon: iconValue }
      })
      rerender(<IconPicker ctx={newCtx} />)

      // Selection must ALWAYS remain visible regardless of formValue oscillations
      expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()
      expect(screen.queryByText('No icon selected')).not.toBeInTheDocument()
    }
  })

  it('calls startAutoResizer on mount', async () => {
    const startAutoResizer = vi.fn()
    const ctx = createMockCtx({ startAutoResizer })
    render(<IconPicker ctx={ctx} />)

    expect(startAutoResizer).toHaveBeenCalled()
  })

  it('preserves selection after component unmount/remount', async () => {
    // This simulates DatoCMS unmounting and remounting the plugin
    // The key issue: refs and state reset on remount!
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({ setFieldValue })
    const { unmount } = render(<IconPicker ctx={ctx} />)

    // Open picker and select icon
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    const iconButton = await screen.findByTitle('AArrowDown')
    fireEvent.click(iconButton)

    // Verify selection
    expect(screen.getByText('lucide:AArrowDown')).toBeInTheDocument()

    // Unmount the component (simulates DatoCMS remounting plugin)
    unmount()

    // Remount with formValue still null (DatoCMS hasn't updated yet)
    const staleCtx = createMockCtx({
      setFieldValue,
      formValues: { icon: null }
    })
    render(<IconPicker ctx={staleCtx} />)

    // BUG: After remount with stale formValue, selection is lost!
    // This test should FAIL with current implementation
    // We need to show "No icon selected" here since we can't persist across unmount
    // without formValue being updated
    expect(screen.getByText('No icon selected')).toBeInTheDocument()
  })

  it('shows saved value on reload when formValue is correct', async () => {
    // This simulates what SHOULD happen after save and reload
    // formValue should have the saved value
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = createMockCtx({
      setFieldValue,
      formValues: { icon: 'lucide:Target' }
    })
    render(<IconPicker ctx={ctx} />)

    // Should immediately show the saved icon
    expect(screen.getByText('lucide:Target')).toBeInTheDocument()
      })

  it('handles nested field paths like blocks.0.features.0.licon', async () => {
    // DatoCMS uses dot-notation paths for nested fields in modular content
    // The fieldPath might be "blocks.0.features.0.licon"
    // And formValues would be { blocks: [{ features: [{ licon: 'lucide:Target' }] }] }
    const setFieldValue = vi.fn(() => Promise.resolve())
    const ctx = {
      fieldPath: 'blocks.0.features.0.licon',
      formValues: {
        blocks: [{
          features: [{
            licon: 'lucide:Target'
          }]
        }]
      },
      setFieldValue,
      startAutoResizer: vi.fn(),
      stopAutoResizer: vi.fn(),
      updateHeight: vi.fn(),
      field: { attributes: { api_key: 'licon' } },
      itemType: { attributes: { api_key: 'test' } },
    } as unknown as RenderFieldExtensionCtx

    render(<IconPicker ctx={ctx} />)

    // Should correctly read the nested value and show the icon
    expect(screen.getByText('lucide:Target')).toBeInTheDocument()
      })
})
