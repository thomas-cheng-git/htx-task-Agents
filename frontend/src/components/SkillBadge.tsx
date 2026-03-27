interface Props {
  name: string;
}

const skillStyles: Record<string, string> = {
  Frontend: 'bg-[#1e3a5f] text-[#60a5fa]',
  Backend: 'bg-[#1a3a2a] text-[#4ade80]',
};

export default function SkillBadge({ name }: Props) {
  const style = skillStyles[name] || 'bg-[#2d2040] text-[#a78bfa]';
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${style}`}>
      {name}
    </span>
  );
}
