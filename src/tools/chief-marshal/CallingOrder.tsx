import { exampleGroups } from "../../lib/liftingOrderExample";

const groupB = exampleGroups[0];

/** The calling order in short, with the rulebook's own example. Source: IWF TCRR 2026, 6.6. */
export default function CallingOrder() {
  return (
    <div className="rules">
      <p className="muted">How the athletes in a group are called, from TCRR 6.6.</p>

      <h2>The four factors</h2>
      <p>When calling the athletes, these four factors decide, in this order (TCRR 6.6.6):</p>
      <ol>
        <li>The weight of the barbell: the lightest weight first.</li>
        <li>The number of the attempt: the lowest number first.</li>
        <li>The order of the previous attempt: the athlete who lifted earliest goes first.</li>
        <li>The start number: the lowest first.</li>
      </ol>
      <p>A factor only counts when all the ones above it are equal.</p>

      <h2>Around the order</h2>
      <ul>
        <li>
          The barbell is loaded in progression. Once a weight is loaded and the clock has started,
          it cannot be reduced (6.6.1).
        </li>
        <li>After a good lift the next attempt is 1 kg more. After a no lift it stays the same (6.6.3).</li>
        <li>Each attempt can be changed twice after it is declared (6.6.12).</li>
        <li>
          An athlete who lifts twice in a row gets two minutes instead of one for the second
          attempt (6.6.7).
        </li>
      </ul>

      <h2>The rulebook's example</h2>
      <p>
        The snatch of men's 60 kg, group B, from the Regulation to 6.6.6. The number in brackets
        is the calling order.
      </p>
      <div className="board-wrap">
        <table className="order-board">
          <thead>
            <tr>
              <th scope="col">Start</th>
              <th scope="col">Lot</th>
              <th scope="col">Name</th>
              <th scope="col">1</th>
              <th scope="col">2</th>
              <th scope="col">3</th>
            </tr>
          </thead>
          <tbody>
            {groupB.athletes.map((a) => (
              <tr key={a.start}>
                <td>{a.start}</td>
                <td>{a.lot}</td>
                <th scope="row">{a.name}</th>
                {a.snatch.map((x, i) => (
                  <td key={i}>
                    {x ? (
                      <>
                        <span className="weight">{x[0]}</span>
                        <span className="order-no">({x[1]})</span>
                      </>
                    ) : (
                      "–"
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul>
        <li>A, C and F all open with 100 kg on attempt 1, so the start number decides: 4, 5, 6.</li>
        <li>
          D, B, A and C all take 100 kg on attempt 2. They go in the order of their first attempts,
          numbers 1, 3, 4 and 5, so they are called 7, 8, 9 and 10.
        </li>
        <li>
          A's third attempt at 100 kg (11) comes after C's second at 100 kg (10): same weight, but a
          higher attempt number. It still comes before E's 101 kg (12): lighter weight first.
        </li>
      </ul>
    </div>
  );
}
