import { ReviewForm } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ maxWidth: "560px", padding: "1rem" }}>
      <ReviewForm productName="7 Mukhi Rudraksha Pendant" mukhi={7} />
    </div>
  );
}

export function ForMala() {
  return (
    <div style={{ maxWidth: "560px", padding: "1rem" }}>
      <ReviewForm productName="5 Mukhi Mala — 108 Beads" mukhi={5} />
    </div>
  );
}
