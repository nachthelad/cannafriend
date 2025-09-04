import { render, screen } from '@testing-library/react'
import { AnimatedLogo } from '@/components/common/animated-logo'

describe('AnimatedLogo', () => {
  it('renders the animated logo with default props', () => {
    render(<AnimatedLogo />)
    
    const logo = screen.getByRole('img', { name: 'Cannafriend loading' })
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveClass('inline-block')
  })

  it('renders with custom size', () => {
    render(<AnimatedLogo size={32} />)
    
    const logo = screen.getByRole('img')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('width', '32')
    expect(logo).toHaveAttribute('height', '32')
  })

  it('applies custom className', () => {
    const customClass = 'text-blue-500'
    render(<AnimatedLogo className={customClass} />)
    
    const logo = screen.getByRole('img')
    expect(logo).toHaveClass(customClass)
    expect(logo).toHaveClass('inline-block') // default class should still be there
  })

  it('passes through additional props', () => {
    render(<AnimatedLogo id="test-logo" />)
    
    const logo = screen.getByRole('img')
    expect(logo).toHaveAttribute('id', 'test-logo')
  })
})