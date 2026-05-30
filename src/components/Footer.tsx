export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">charted with React Three Fiber · Bun · Vite — © {year} jtay</footer>
  )
}
