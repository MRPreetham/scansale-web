import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { addQty, changeQty, totals, type CartLine } from './cart'
import type { Product } from '@/types/api'

interface CartContextValue {
  lines: CartLine[]
  add: (product: Product, qty: number) => void
  adjust: (productId: string, delta: number) => void
  clear: () => void
  totals: { qty: number; amount: number }
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])

  const add = useCallback((product: Product, qty: number) => {
    setLines((prev) => addQty(prev, product, qty))
  }, [])

  const adjust = useCallback((productId: string, delta: number) => {
    setLines((prev) => changeQty(prev, productId, delta))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  return (
    <CartContext.Provider value={{ lines, add, adjust, clear, totals: totals(lines) }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
