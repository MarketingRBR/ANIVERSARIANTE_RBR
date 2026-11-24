export function SetupNeeded() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-900">Configuração pendente</h1>
        <p className="mt-2 text-sm text-slate-600">O portal ainda não está conectado ao Supabase. Defina as variáveis <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> e <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> (arquivo <code className="rounded bg-slate-100 px-1">.env</code> local ou Secrets do GitHub Actions) e gere o build novamente. Veja o passo a passo no README.</p>
      </div>
    </div>
  )
}
