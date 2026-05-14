import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('returns empty string with no arguments', () => {
    expect(cn()).toBe('')
  })

  it('merges class strings', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('deduplicates conflicting Tailwind classes (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles falsy conditionals', () => {
    expect(cn('foo', false && 'bar')).toBe('foo')
    expect(cn('foo', undefined)).toBe('foo')
    expect(cn('foo', null)).toBe('foo')
  })

  it('handles truthy conditionals', () => {
    expect(cn('foo', true && 'bar')).toBe('foo bar')
  })

  it('handles object syntax', () => {
    expect(cn({ 'font-bold': true, 'text-red-500': false })).toBe('font-bold')
  })

  it('handles array syntax', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles mixed inputs', () => {
    expect(cn('base', { active: true, disabled: false }, ['extra'])).toBe('base active extra')
  })

  it('merges complex conflicting Tailwind classes', () => {
    expect(cn('px-2 py-1 bg-red-500', 'px-4 bg-white')).toBe('py-1 px-4 bg-white')
  })
})
