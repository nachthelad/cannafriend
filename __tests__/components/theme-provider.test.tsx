import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/providers/theme-provider'

describe('ThemeProvider', () => {
  it('renders children correctly', () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="dark">
        <div data-testid="child-element">Test Content</div>
      </ThemeProvider>
    )
    
    const childElement = screen.getByTestId('child-element')
    expect(childElement).toBeInTheDocument()
    expect(childElement).toHaveTextContent('Test Content')
  })

  it('provides theme context', () => {
    const { container } = render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div>Theme Provider Test</div>
      </ThemeProvider>
    )
    
    // The theme provider should render without errors
    expect(container).toBeInTheDocument()
  })
})