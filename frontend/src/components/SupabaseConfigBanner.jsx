function SupabaseConfigBanner() {
  return (
    <main className="app-shell theme-light">
      <section className="container config-error-panel">
        <h1>Configuration required</h1>
        <p>
          Supabase environment variables are missing. The app cannot connect to
          the database.
        </p>
        <ol>
          <li>
            In Vercel → <strong>Settings → Environment Variables</strong>, add:
            <ul>
              <li>
                <code>VITE_SUPABASE_URL</code>
              </li>
              <li>
                <code>VITE_SUPABASE_ANON_KEY</code>
              </li>
            </ul>
          </li>
          <li>Enable them for Production, Preview, and Development.</li>
          <li>Redeploy the project (Deployments → Redeploy).</li>
        </ol>
        <p className="config-hint">
          Names must start with <code>VITE_</code> so Vite can embed them at
          build time.
        </p>
      </section>
    </main>
  );
}

export default SupabaseConfigBanner;
