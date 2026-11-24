import { Link } from 'react-router-dom'
import { ArrowRight, CalendarCheck2, ClipboardCheck, Cake, MapPinned } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const STEPS = [
  { icon: MapPinned, title: 'Selecione sua região', text: 'Você acessa somente os cadastros autorizados para o seu usuário.' },
  { icon: ClipboardCheck, title: 'Confira os cadastros', text: 'Confirme se cada contato continua ativo e se a data está correta.' },
  { icon: CalendarCheck2, title: 'Atualize e inclua', text: 'Corrija aniversários e adicione novos contatos que ainda não estão na base.' },
]

export default function Home() {
  const { session } = useAuth()
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-rbr-900 via-rbr-700 to-rbr-600 text-white">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rbr-400/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide ring-1 ring-inset ring-white/20"><Cake className="h-3.5 w-3.5" />Relacionamento RBR</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">ANIVERSARIANTES <span className="text-rbr-200">RBR</span></h1>
            <p className="mt-4 max-w-xl text-lg font-medium text-rbr-100">Manter nossos cadastros atualizados é uma forma de fortalecer relacionamentos.</p>
            <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-rbr-100/90">Promotor, selecione sua região, confira os cadastros disponíveis e atualize as informações de aniversário. Sua participação é fundamental para manter nossa base de contatos sempre atualizada.</p>
            <Link to={session ? '/regioes' : '/entrar'} className="btn mt-8 !min-h-[52px] bg-white px-7 text-base text-rbr-800 shadow-lift hover:bg-rbr-50">ACESSAR MINHA REGIÃO <ArrowRight className="h-5 w-5" /></Link>
          </div>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-xl2 bg-white/10 p-4 ring-1 ring-inset ring-white/15 backdrop-blur-sm">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-rbr-700"><s.icon className="h-5 w-5" /></span>
                <div><p className="text-xs font-bold text-rbr-200">PASSO {i + 1}</p><p className="font-bold">{s.title}</p><p className="text-sm text-rbr-100/90">{s.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}
