type Props<T extends string | number> = {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

export default function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <div className="flex gap-1 rounded-2xl bg-surface p-1" role="group">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={o.value === value}
          className={`h-10 flex-1 rounded-xl text-sm font-medium ${
            o.value === value ? 'bg-[#2a313b] text-white' : 'text-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
