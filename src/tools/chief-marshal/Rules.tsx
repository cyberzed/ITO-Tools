/** The Chief Marshal's job in short. Source: IWF TCRR 2026, 7.9, the Regulation to 7.9 and 6.6. */
export default function Rules() {
  return (
    <div className="rules">
      <p className="muted">
        The Chief Marshal at the Marshals' table, in short. The numbers in brackets are TCRR
        references.
      </p>

      <h2>The job</h2>
      <ul>
        <li>
          The main duty is to <strong>accept or decline</strong> any change that a Team Official or
          an athlete makes to a declaration or an attempt on the Athlete's Card, following the rules
          (7.9.1).
        </li>
        <li>
          The Marshals supervise the declarations and changes. They are passed on at once to the
          Competition Management, who tell the Speaker (Regulation to 7.9, 3). The Chief Marshal
          does it by intercom, telephone or computer (7.9.2).
        </li>
        <li>
          The Athlete's Card records the weight of every declaration and attempt. The Team Official
          or athlete initials each entry (Regulation to 7.9, 1).
        </li>
        <li>The Chief Marshal also monitors and enforces the 20 kg Rule (7.9.5, 6.6.5).</li>
        <li>The Marshals' table is open 30 minutes before the introduction of the athletes (Regulation to 7.9, 5).</li>
      </ul>

      <h2>What to check on every card</h2>
      <ol>
        <li>The weight is a whole number of kg (6.6.2).</li>
        <li>
          A declaration enables <strong>two changes</strong>. A third change is declined (6.6.12).
        </li>
        <li>
          The athlete whose <strong>clock has started</strong>: the weight is loaded, and it cannot
          be reduced any more (6.6.1, 6.6.10).
        </li>
        <li>
          An <strong>increase</strong> must be signed before the final call, which sounds 30 seconds
          before the end of the allocated time. For one minute that is at 0:30 (6.6.10, 6.6.11).
        </li>
        <li>
          An athlete whose clock has <strong>not started</strong> may still raise or lower the
          weight, if a change is free (6.6.10).
        </li>
      </ol>
      <p>
        The time that counts is the moment the card is handed in, not the moment you answer. Read
        the clock when the card arrives.
      </p>

      <h2>In this menu</h2>
      <ul>
        <li>The <strong>athlete card</strong>: the initial card at weigh-in, and a simulation of the snatch and the clean &amp; jerk, attempt by attempt.</li>
        <li>The <strong>calling order</strong>: the four factors that decide who lifts next, and a practice in calling a group.</li>
        <li>The <strong>Marshals' table</strong>: the live practice described below.</li>
      </ul>

      <h2>The Marshals' table</h2>
      <p>
        You are the Chief Marshal. Two athletes lift a snatch, one after the other in the calling
        order, and the clock runs for the athlete who is called. You can add one or two more, for
        a group of three or four, with the athlete cards side by side. Coaches hand in cards at random
        moments, for the athlete on the clock and for the ones waiting. <strong>Accept</strong> or{" "}
        <strong>decline</strong> each card.
      </p>
      <p>
        You hear nothing while you decide. When the athlete raises the bar, the clock stops and the
        practice checks every card of that attempt against the rules. A change you accepted rightly
        goes on the athlete's card. A card you leave unanswered counts as missed.
      </p>

      <h2>Not in the practice</h2>
      <ul>
        <li>
          The declaration of the next attempt is always the automatic progression: 1 kg more after
          a good lift, the same weight after a no lift (6.6.3). The practice does not test the 30
          second limit for two attempts in a row (6.6.14), or what happens when nothing is signed by
          the final call (6.6.13).
        </li>
        <li>
          The clock does not stop for a change of weight (6.6.15), and there are no Speaker or
          Competition Management messages.
        </li>
        <li>The clean &amp; jerk and the 20 kg Rule are not included.</li>
      </ul>
    </div>
  );
}
