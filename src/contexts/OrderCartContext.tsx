import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface CartItem {
  menuId: string
  name: string
  price: number
  quantity: number
  specInfo?: string
  image?: string
}

interface OrderCartContextValue {
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  updateCartQty: (menuId: string, specInfo: string | undefined, delta: number) => void
  cartTotal: number
  clearCart: () => void
}

const OrderCartContext = createContext<OrderCartContextValue | null>(null)

export function OrderCartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])

  const updateCartQty = useCallback((menuId: string, specInfo: string | undefined, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.menuId === menuId && (i.specInfo ?? '') === (specInfo ?? '') ? { ...i, quantity: i.quantity + delta } : i
        )
        .filter((i) => i.quantity > 0)
    )
  }, [])

  const cartTotal = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.quantity, 0), [cart])

  const clearCart = useCallback(() => setCart([]), [])

  const value: OrderCartContextValue = useMemo(
    () => ({ cart, setCart, updateCartQty, cartTotal, clearCart }),
    [cart, updateCartQty, cartTotal, clearCart]
  )

  return <OrderCartContext.Provider value={value}>{children}</OrderCartContext.Provider>
}

export function useOrderCart() {
  const ctx = useContext(OrderCartContext)
  if (!ctx) throw new Error('useOrderCart must be used within OrderCartProvider')
  return ctx
}
