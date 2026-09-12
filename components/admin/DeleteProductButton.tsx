'use client'

import { useActionState, useState } from 'react'
import { deleteProduct } from '@/app/admin/actions'
import type { ProductActionState } from '@/lib/products'

const initialState: ProductActionState = {}

export default function DeleteProductButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false)
  const [state, action, pending] = useActionState(deleteProduct, initialState)
  if (state.success) return <span className="field-help" role="status">Product deleted</span>
  return <div className="product-delete">
    {!confirming ? <button type="button" className="btn danger small" aria-label={`Delete ${name}`} onClick={() => setConfirming(true)}>Delete</button> :
      <form action={action} className="delete-confirmation">
        <input type="hidden" name="id" value={id} />
        <p>Delete <strong>{name}</strong>? This cannot be undone.</p>
        <div className="actions"><button className="btn danger small" disabled={pending}>{pending ? 'Deleting…' : 'Confirm delete'}</button>
          <button type="button" className="btn btn-ghost small" disabled={pending} onClick={() => setConfirming(false)}>Keep product</button></div>
        {state.error ? <p className="field-error" role="alert">{state.error}</p> : null}
      </form>}
  </div>
}
