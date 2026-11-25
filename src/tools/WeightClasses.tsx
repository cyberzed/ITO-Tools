import { categoriesFor, type Category, type Gender } from "../lib/categories";

const kg = (n: number) => n.toFixed(2);

/** The bodyweight range of the category at `index`, written like the rulebook table. */
function rangeOf(list: Category[], index: number): string {
  const { maxKg } = list[index];
  if (maxKg === null) return `> ${kg(list[index - 1].maxKg!)} kg`;
  if (index === 0) return `≤ ${kg(maxKg)} kg`;
  // A category includes its upper limit, so the next one starts 0.01 kg above the previous limit.
  return `${kg(list[index - 1].maxKg! + 0.01)}–${kg(maxKg)} kg`;
}

function ClassTable({ gender, title }: { gender: Gender; title: string }) {
  const list = categoriesFor(gender);
  return (
    <div className="class-table">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Class</th>
            <th scope="col">Bodyweight</th>
          </tr>
        </thead>
        <tbody>
          {list.map((c, i) => (
            <tr key={c.label}>
              <th scope="row">{c.label}</th>
              <td>{rangeOf(list, i)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WeightClasses() {
  return (
    <section>
      <h1>Weight classes</h1>
      <p className="muted">
        Senior bodyweight classes. A class includes its upper limit, so an athlete at 60.00 kg
        is in M60 and one at 60.01 kg is in M65.
      </p>
      <div className="class-tables">
        <ClassTable gender="M" title="Men" />
        <ClassTable gender="F" title="Women" />
      </div>
    </section>
  );
}
