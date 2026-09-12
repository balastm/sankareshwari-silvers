'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function ProductImage({ src, name, className }: { src: string | null; name: string; className: string }) {
  const [failedSource, setFailedSource] = useState<string | null>(null)
  const usable = src && /^(https?:\/\/|blob:|\/[^/])/.test(src) && src !== failedSource
  return <div className={className}>
    {usable ? <Image src={src} alt={name} width={420} height={420} unoptimized onError={() => setFailedSource(src)} /> :
      <div className="product-photo-placeholder" role="img" aria-label={`No photo for ${name}`}>
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="m8 8 10-4 10 4 5 10-15 15L3 18 8 8Z" stroke="currentColor" strokeWidth="1.4" /><path d="M3 18h30M8 8l10 25L28 8M8 8h20" stroke="currentColor" strokeWidth="1.4" /></svg>
        <span>No photo yet</span>
      </div>}
  </div>
}
