export default function ToolPlaceholder({ title }: { title: string }) {
  return (
    <section>
      <h1>{title}</h1>
      <p className="muted">This tool is not built yet.</p>
    </section>
  );
}
