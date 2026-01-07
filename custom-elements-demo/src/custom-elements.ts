/**
 * Custom Elements Demo - React 19 Compatible
 * 
 * This demonstrates the "opentui pattern" in the browser:
 * - Parent element catches registration events from children
 * - Children self-register via event bubbling (like findParent + register)
 * - Imperative methods for navigation/selection
 * - React 19 passes functions/objects as properties, not attributes
 */

// ─────────────────────────────────────────────────────────────────────────────
// CustomList - Parent element that manages items
// ─────────────────────────────────────────────────────────────────────────────

export class CustomList extends HTMLElement {
  private items = new Map<string, CustomListItem>()
  private _selectedIndex = 0
  
  // Use non-"on" prefix so React doesn't treat it as event handler
  selectionCallback?: (index: number, item: CustomListItem | undefined) => void

  connectedCallback() {
    this.style.display = 'block'
    this.style.border = '1px solid #444'
    this.style.borderRadius = '8px'
    this.style.padding = '8px'
    this.style.outline = 'none'
    this.tabIndex = 0
    
    this.addEventListener('item:register', this.handleRegister as EventListener)
    this.addEventListener('item:unregister', this.handleUnregister as EventListener)
    this.addEventListener('keydown', this.handleKeydown)
    this.addEventListener('focus', () => { this.style.borderColor = '#0066cc' })
    this.addEventListener('blur', () => { this.style.borderColor = '#444' })
  }

  disconnectedCallback() {
    this.removeEventListener('item:register', this.handleRegister as EventListener)
    this.removeEventListener('item:unregister', this.handleUnregister as EventListener)
    this.removeEventListener('keydown', this.handleKeydown)
  }

  private handleRegister = (e: CustomEvent) => {
    e.stopPropagation()
    const item = e.detail.element as CustomListItem
    this.items.set(e.detail.id, item)
    this.updateSelection()
  }

  private handleUnregister = (e: CustomEvent) => {
    e.stopPropagation()
    this.items.delete(e.detail.id)
    this.updateSelection()
  }

  private handleKeydown = (e: KeyboardEvent) => {
    const size = this.items.size
    if (size === 0) return

    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      this._selectedIndex = Math.min(this._selectedIndex + 1, size - 1)
      this.updateSelection()
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      this._selectedIndex = Math.max(this._selectedIndex - 1, 0)
      this.updateSelection()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const item = [...this.items.values()][this._selectedIndex]
      item?.actionCallback?.()
    }
  }

  private updateSelection() {
    const arr = [...this.items.values()]
    arr.forEach((item, i) => { item.selected = i === this._selectedIndex })
    this.selectionCallback?.(this._selectedIndex, arr[this._selectedIndex])
  }

  moveSelection(delta: number) {
    const size = this.items.size
    if (size === 0) return
    this._selectedIndex = Math.max(0, Math.min(this._selectedIndex + delta, size - 1))
    this.updateSelection()
  }

  getSelectedItem(): CustomListItem | undefined {
    return [...this.items.values()][this._selectedIndex]
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CustomListItem - Child element that self-registers
// ─────────────────────────────────────────────────────────────────────────────

export class CustomListItem extends HTMLElement {
  private _id = crypto.randomUUID()
  private _selected = false

  // Props set by React 19 as properties!
  // Use non-"on" prefix so React doesn't treat it as event handler
  title = ''
  subtitle = ''
  keywords: string[] = []
  actionCallback?: () => void

  get selected() { return this._selected }
  set selected(v: boolean) {
    this._selected = v
    this.style.background = v ? '#0066cc' : 'transparent'
    this.style.color = v ? '#fff' : '#eee'
    this.setAttribute('aria-selected', String(v))
    if (v) this.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  connectedCallback() {
    this.style.display = 'flex'
    this.style.flexDirection = 'column'
    this.style.padding = '8px 12px'
    this.style.borderRadius = '4px'
    this.style.cursor = 'pointer'
    this.style.transition = 'background 0.1s'
    this.setAttribute('role', 'option')

    this.addEventListener('click', () => { this.actionCallback?.() })

    // Self-register via event bubbling (like opentui's findParent + register)
    this.dispatchEvent(new CustomEvent('item:register', {
      bubbles: true,
      detail: { id: this._id, element: this }
    }))
  }

  disconnectedCallback() {
    document.dispatchEvent(new CustomEvent('item:unregister', {
      detail: { id: this._id }
    }))
  }
}

customElements.define('custom-list', CustomList)
customElements.define('custom-list-item', CustomListItem)
