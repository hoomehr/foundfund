"use client"

import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current === e.target) onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div
        ref={modalRef}
        className="bg-card border rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[0_0_30px_rgba(255,255,255,0.1)] animate-in fade-in zoom-in-95 duration-300"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex justify-between items-center p-6 border-b" style={{ borderColor: 'var(--border)' }}>
          {title && <h2 className="text-2xl font-bold">{title}</h2>}
          <button
            onClick={onClose}
            className="bg-white text-black w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.5)] hover:shadow-[0_0_20px_rgba(255,255,255,0.7)]"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  )
}
