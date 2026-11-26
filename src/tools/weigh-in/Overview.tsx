/** The weigh-in rules in short. Source: IWF TCRR 2026, 6.4 and the Regulation to 6.4. */
export default function Overview() {
  return (
    <div className="rules">
      <p className="muted">
        The weigh-in in short. The numbers in brackets point to the Regulation to TCRR 6.4 unless
        they say otherwise.
      </p>

      <h2>When</h2>
      <p>
        The weigh-in starts three hours before the group starts and lasts one hour (TCRR 6.4.1).
      </p>

      <h2>Who and in what order</h2>
      <ul>
        <li>Each athlete is weighed in front of two Referees of the same gender as the athlete (3).</li>
        <li>One Team Official may come along (5).</li>
        <li>
          Athletes are called one at a time in lot number order. An athlete who is not there when
          called is weighed at the end (7).
        </li>
        <li>When categories are combined in one group, the lower category is weighed first (8).</li>
        <li>The athlete shows a passport or an identity card (9).</li>
      </ul>

      <h2>The 250 g for the costume</h2>
      <p>
        The athlete is weighed in the costume they compete in, without shoes or socks. 250 g is
        deducted from what the scale shows, for the weight of the costume (10).
      </p>

      <h2>Making weight</h2>
      <ul>
        <li>
          After the deduction, the bodyweight must be within the category the athlete is entered
          in. A category includes its upper limit, so 85.00 kg is in M85 and 75.00 kg is in M75,
          not M85 (10).
        </li>
        <li>An athlete who makes weight is weighed only once (14).</li>
        <li>
          An athlete who is too heavy or too light may come back to the scale as many times as
          needed, outside the lot order (14).
        </li>
        <li>
          An athlete who has not made weight when the weigh-in ends is out of the competition,
          but keeps the other privileges of an accredited participant (15).
        </li>
      </ul>

      <h2>The athlete's card</h2>
      <p>
        The athlete or the Team Official signs the card to confirm the bodyweight and declares the
        starting weights for the snatch and the clean &amp; jerk, which must respect the 20 kg Rule
        (16, TCRR 6.6.5). A later change to a starting weight counts as one of the two changes.
      </p>

      <h2>After the weigh-in</h2>
      <p>
        The athletes get start numbers in lot number order, lower category first, starting at 1
        (21).
      </p>
    </div>
  );
}
