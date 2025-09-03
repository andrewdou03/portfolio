type Props = {
  id: string;
  label: string;
  children: React.ReactNode;
};

export default function Section({ id, label, children }: Props) {
  return (
    <section id={id} aria-label={label} className="min-h-screen py-24 flex items-center">
      {children}
    </section>
  );
}
