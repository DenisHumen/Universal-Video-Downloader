import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

/*
  A drop-down opened from a dialog drew behind it: popovers sat on the overlay
  level, below the modal one, so choosing a dub in Add Watch showed its list
  under the dialog. Popovers and tooltips now have a level above every dialog.
*/
const css = readFileSync(join(__dirname, '..', 'index.css'), 'utf8')
const level = (name: string): number => Number(new RegExp(`--z-${name}:\\s*(\\d+)`).exec(css)?.[1])

describe('the depth ladder', () => {
  it('puts drop-downs, menus and tooltips above every dialog', () => {
    expect(level('popover')).toBeGreaterThan(level('modal'))
    expect(level('popover')).toBeGreaterThan(level('overlay'))
  })

  it('is what the popover and tooltip use', () => {
    for (const file of ['Popover.tsx', 'Tooltip.tsx']) {
      expect(readFileSync(join(__dirname, file), 'utf8'), file).toContain('var(--z-popover)')
    }
  })
})
